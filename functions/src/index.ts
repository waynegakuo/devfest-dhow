/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError, onCallGenkit} from 'firebase-functions/v2/https';
import {getFirestore} from 'firebase-admin/firestore';
// import {getStorage} from 'firebase-admin/storage'; // Unused import
import { genkit } from 'genkit'; // This is the core Genkit library itself
import {initializeApp} from 'firebase-admin/app';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';
import googleAI from '@genkit-ai/googleai';
import {defineSecret} from 'firebase-functions/params';
import { z } from 'zod';

// Zod Schemas for data validation
const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

const QuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1)
});

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(QuizOptionSchema).length(4),
  correctAnswerId: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: DifficultySchema
});

const QuizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  timeTaken: z.number().min(0).optional()
});

const QuizAttemptSchema = z.object({
  id: z.string().optional(),
  navigatorId: z.string().min(1),
  topicId: z.string().min(1),
  topicName: z.string().min(1),
  questions: z.array(QuizQuestionSchema).optional(),
  answers: z.array(QuizAnswerSchema).optional(),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().min(0).optional()
});

const TopicStatsSchema = z.object({
  topicId: z.string().min(1),
  topicName: z.string().min(1),
  attempts: z.number().min(0),
  bestScore: z.number().min(0).max(100),
  averageScore: z.number().min(0).max(100),
  lastAttempt: z.string()
});

const QuizStatsSchema = z.object({
  navigatorId: z.string().min(1),
  totalQuizzes: z.number().min(0),
  completedQuizzes: z.number().min(0),
  averageScore: z.number().min(0).max(100),
  topicStats: z.array(TopicStatsSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Input validation schemas
const GenerateQuizQuestionsInputSchema = z.object({
  topicId: z.string().min(1),
  difficulty: DifficultySchema.default('medium'),
  numQuestions: z.number().min(1).max(20).default(5)
});


const SaveQuizAttemptInputSchema = z.object({
  navigatorId: z.string().min(1),
  quizAttempt: QuizAttemptSchema
});

const GetNavigatorQuizStatsInputSchema = z.object({
  navigatorId: z.string().min(1)
});

// Response validation schemas
const GenerateQuizQuestionsResponseSchema = z.object({
  success: z.boolean(),
  topicId: z.string(),
  topicName: z.string(),
  questions: z.array(QuizQuestionSchema),
  generatedAt: z.string()
});


const SaveQuizAttemptResponseSchema = z.object({
  success: z.boolean(),
  attemptId: z.string(),
  message: z.string()
});

const GetNavigatorQuizStatsResponseSchema = z.object({
  success: z.boolean(),
  stats: QuizStatsSchema
});

// Define your secret keys and other environment variables here
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
// const storage = getStorage(); // Unused variable

enableFirebaseTelemetry();

// Configure Genkit
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: googleAI.model('gemini-2.5-flash')
});

// Quiz topics configuration
const QUIZ_TOPICS = {
  gemma: {
    name: 'Gemma',
    description: 'Google\'s Gemma language model and its applications',
    context: 'Gemma is a family of lightweight, state-of-the-art open models built from the same research and technology used to create the Gemini models.'
  },
  genkit: {
    name: 'Genkit',
    description: 'Firebase Genkit capabilities and AI application development',
    context: 'Firebase Genkit is a framework for building AI-powered applications with Firebase and Google Cloud services.'
  },
  'firebase-ai': {
    name: 'Firebase AI Logic',
    description: 'Client SDKs for Gemini and Imagen models with security features',
    context: 'Firebase AI Logic gives you access to the latest generative AI models from Google: the Gemini models and Imagen models. These client SDKs are built specifically for use with mobile and web apps, offering security options against unauthorized clients as well as integrations with other Firebase services.'
  },
  'vertex-ai': {
    name: 'Vertex AI',
    description: 'Google Cloud\'s Vertex AI platform and ML capabilities',
    context: 'Vertex AI is Google Cloud\'s unified ML platform that helps you build, deploy, and scale ML models faster.'
  },
  adk: {
    name: 'Agent Development Kit (ADK)',
    description: 'Flexible framework for developing and deploying AI agents',
    context: 'Agent Development Kit (ADK) is a flexible and modular framework for developing and deploying AI agents. While optimized for Gemini and the Google ecosystem, ADK is model-agnostic, deployment-agnostic, and is built for compatibility with other frameworks. ADK was designed to make agent development feel more like software development.'
  }
};

// Define Genkit flow for quiz question generation
export const _quizGenerationFlowLogic = ai.defineFlow(
  {
    name: 'generateQuizQuestions',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsResponseSchema,
  },
  async (input: z.infer<typeof GenerateQuizQuestionsInputSchema>) => {
    const { topicId, difficulty, numQuestions } = input;

    if (!QUIZ_TOPICS[topicId as keyof typeof QUIZ_TOPICS]) {
      throw new Error('Invalid topic ID provided');
    }

    const topic = QUIZ_TOPICS[topicId as keyof typeof QUIZ_TOPICS];

    const prompt = `
    You are an expert quiz creator specializing in AI and machine learning topics.

    Create ${numQuestions} multiple-choice questions about ${topic.name}.

    Context: ${topic.context}

    Requirements:
    - Difficulty level: ${difficulty}
    - Each question should have 4 options (A, B, C, D)
    - Only one correct answer per question
    - Include a brief explanation for the correct answer
    - Questions should be practical and relevant to developers
    - Avoid overly theoretical or obscure topics

    Return the response as a JSON object with this exact structure:
    {
      "questions": [
        {
          "id": "unique-id-1",
          "question": "Question text here?",
          "options": [
            {"id": "a", "text": "Option A text"},
            {"id": "b", "text": "Option B text"},
            {"id": "c", "text": "Option C text"},
            {"id": "d", "text": "Option D text"}
          ],
          "correctAnswerId": "a",
          "explanation": "Brief explanation of why this answer is correct",
          "difficulty": "${difficulty}"
        }
      ]
    }
    `;

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: prompt,
    });

    let parsedResult;
    try {
      parsedResult = JSON.parse(result.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      throw new Error('Failed to generate valid quiz questions');
    }

    // Validate AI response structure with Zod
    const questionsValidation = z.array(QuizQuestionSchema).safeParse(parsedResult.questions);
    if (!questionsValidation.success) {
      console.error('AI response validation failed:', questionsValidation.error);
      throw new Error('Invalid quiz structure returned from AI');
    }

    const response = {
      success: true,
      topicId,
      topicName: topic.name,
      questions: questionsValidation.data,
      generatedAt: new Date().toISOString()
    };

    // Validate response structure
    const responseValidation = GenerateQuizQuestionsResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      throw new Error('Failed to generate valid response structure');
    }

    return responseValidation.data;
  }
);

// Generate quiz questions for a specific topic using onCallGenkit
export const generateQuizQuestions = onCallGenkit(
  {
    secrets: [GEMINI_API_KEY],
    region: 'africa-south1',
    cors: true,
  },
  _quizGenerationFlowLogic
);


// Save quiz attempt to user profile
export const saveQuizAttempt = onCall(
  {
    region: 'africa-south1',
    cors: true,
  },
  async (request) => {
  // Validate input data with Zod schema
  try {
    const validatedInput = SaveQuizAttemptInputSchema.parse(request.data);
    const { navigatorId, quizAttempt } = validatedInput;

    // Validate quiz attempt structure
    const attemptValidation = QuizAttemptSchema.safeParse(quizAttempt);
    if (!attemptValidation.success) {
      console.error('Quiz attempt validation failed:', attemptValidation.error);
      throw new HttpsError('invalid-argument', `Invalid quiz attempt structure: ${attemptValidation.error.errors.map(e => e.message).join(', ')}`);
    }

    // Save quiz attempt to user's quiz history
    const attemptId = `${navigatorId}_${attemptValidation.data.topicId}_${Date.now()}`;

    await db.collection('quiz_attempts').doc(attemptId).set({
      ...attemptValidation.data,
      id: attemptId,
      navigatorId,
      createdAt: new Date().toISOString()
    });

    // Update user's quiz statistics
    const userStatsRef = db.collection('navigator_quiz_stats').doc(navigatorId);
    const userStatsDoc = await userStatsRef.get();

    if (userStatsDoc.exists) {
      const currentStats = userStatsDoc.data();

      // Validate existing stats structure
      const statsValidation = QuizStatsSchema.partial().safeParse(currentStats);
      if (!statsValidation.success) {
        console.warn('Existing stats validation failed, recreating stats:', statsValidation.error);
      }

      const topicStats = currentStats?.topicStats || [];

      // Update or add topic stats
      const topicIndex = topicStats.findIndex((t: any) => t.topicId === attemptValidation.data.topicId);

      if (topicIndex >= 0) {
        topicStats[topicIndex] = {
          ...topicStats[topicIndex],
          attempts: topicStats[topicIndex].attempts + 1,
          bestScore: Math.max(topicStats[topicIndex].bestScore, attemptValidation.data.percentage || 0),
          lastAttempt: new Date().toISOString()
        };
      } else {
        topicStats.push({
          topicId: attemptValidation.data.topicId,
          topicName: attemptValidation.data.topicName,
          attempts: 1,
          bestScore: attemptValidation.data.percentage || 0,
          averageScore: attemptValidation.data.percentage || 0,
          lastAttempt: new Date().toISOString()
        });
      }

      await userStatsRef.update({
        totalQuizzes: (currentStats?.totalQuizzes || 0) + 1,
        completedQuizzes: (currentStats?.completedQuizzes || 0) + 1,
        topicStats: topicStats,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create initial stats with validation
      const initialStats = {
        navigatorId,
        totalQuizzes: 1,
        completedQuizzes: 1,
        averageScore: attemptValidation.data.percentage || 0,
        topicStats: [{
          topicId: attemptValidation.data.topicId,
          topicName: attemptValidation.data.topicName,
          attempts: 1,
          bestScore: attemptValidation.data.percentage || 0,
          averageScore: attemptValidation.data.percentage || 0,
          lastAttempt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate initial stats structure
      const initialStatsValidation = QuizStatsSchema.safeParse(initialStats);
      if (!initialStatsValidation.success) {
        console.error('Initial stats validation failed:', initialStatsValidation.error);
        throw new HttpsError('internal', 'Failed to create valid stats structure');
      }

      await userStatsRef.set(initialStatsValidation.data);
    }

    const response = {
      success: true,
      attemptId,
      message: 'Quiz attempt saved successfully'
    };

    // Validate response structure
    const responseValidation = SaveQuizAttemptResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      throw new HttpsError('internal', 'Failed to generate valid response structure');
    }

    return responseValidation.data;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Input validation failed:', error.errors);
      throw new HttpsError('invalid-argument', `Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error saving quiz attempt:', error);
    throw new HttpsError('internal', 'Failed to save quiz attempt');
  }
});

// Get navigator's quiz statistics
export const getNavigatorQuizStats = onCall(
  {
    region: 'africa-south1',
    cors: true,
  },
  async (request) => {
  // Validate input data with Zod schema
  try {
    const validatedInput = GetNavigatorQuizStatsInputSchema.parse(request.data);
    const { navigatorId } = validatedInput;

    const statsDoc = await db.collection('navigator_quiz_stats').doc(navigatorId).get();

    let stats;
    if (!statsDoc.exists) {
      // Create default stats for new users
      stats = {
        navigatorId,
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        topicStats: []
      };
    } else {
      const rawStats = statsDoc.data();

      // Validate existing stats structure from database
      const statsValidation = QuizStatsSchema.safeParse(rawStats);
      if (!statsValidation.success) {
        console.warn('Database stats validation failed, returning default stats:', statsValidation.error);
        // Return default stats if existing data is corrupted
        stats = {
          navigatorId,
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          topicStats: []
        };
      } else {
        stats = statsValidation.data;
      }
    }

    const response = {
      success: true,
      stats
    };

    // Validate response structure
    const responseValidation = GetNavigatorQuizStatsResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      throw new HttpsError('internal', 'Failed to generate valid response structure');
    }

    return responseValidation.data;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Input validation failed:', error.errors);
      throw new HttpsError('invalid-argument', `Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error fetching quiz stats:', error);
    throw new HttpsError('internal', 'Failed to fetch quiz statistics');
  }
});



