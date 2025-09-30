export interface QuizTopic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizAttempt {
  id: string;
  navigatorId: string;
  topicId: string;
  topicName: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  startedAt: Date;
  completedAt: Date;
  duration: number; // in seconds
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeTaken: number; // in seconds
}

export interface QuizResult {
  attempt: QuizAttempt;
  passed: boolean;
  feedback: string;
  nextRecommendation?: string;
}

export interface QuizStats {
  navigatorId: string;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  topicStats: TopicStats[];
}

export interface TopicStats {
  topicId: string;
  topicName: string;
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastAttempt: Date;
}

// Predefined quiz topics related to Gemini AI
export const QUIZ_TOPICS: QuizTopic[] = [
  {
    id: 'gemma',
    name: 'Gemma',
    description: 'Test your knowledge of Google\'s Gemma language model and its applications',
    icon: '🤖',
    color: '#4285f4'
  },
  {
    id: 'genkit',
    name: 'Genkit',
    description: 'Explore Firebase Genkit capabilities and AI application development',
    icon: '⚡',
    color: '#ff6d00'
  },
  {
    id: 'firebase-ai',
    name: 'Firebase AI Logic',
    description: 'Client SDKs for Gemini and Imagen models with security features',
    icon: '🔥',
    color: '#ff9800'
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    description: 'Navigate Google Cloud\'s Vertex AI platform and ML capabilities',
    icon: '🎯',
    color: '#9c27b0'
  },
  {
    id: 'adk',
    name: 'Agent Development Kit (ADK)',
    description: 'Flexible framework for developing and deploying AI agents',
    icon: '🛠️',
    color: '#00bcd4'
  }
];
