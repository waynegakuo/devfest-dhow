import { Injectable, inject } from '@angular/core';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  QuizTopic,
  QuizQuestion,
  QuizAttempt,
  QuizResult,
  QuizStats,
  QUIZ_TOPICS
} from '../../models/quiz.model';
import {FirebaseApp} from '@angular/fire/app';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private firebaseApp = inject(FirebaseApp);
  private functions;
  // State management
  private currentQuizSubject = new BehaviorSubject<QuizQuestion[] | null>(null);
  private currentQuizAttemptSubject = new BehaviorSubject<Partial<QuizAttempt> | null>(null);
  private quizProgressSubject = new BehaviorSubject<{ current: number; total: number } | null>(null);

  public currentQuiz$ = this.currentQuizSubject.asObservable();
  public currentQuizAttempt$ = this.currentQuizAttemptSubject.asObservable();
  public quizProgress$ = this.quizProgressSubject.asObservable();

  constructor() {
    this.functions = getFunctions(this.firebaseApp, 'africa-south1');
  }

  /**
   * Get all available quiz topics
   */
  getQuizTopics(): QuizTopic[] {
    return QUIZ_TOPICS;
  }

  /**
   * Generate quiz questions for a specific topic
   */
  generateQuizQuestions(topicId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', numQuestions: number = 5): Observable<QuizQuestion[]> {
    const generateQuestions = httpsCallable(this.functions, 'generateQuizQuestions');

    return from(generateQuestions({ topicId, difficulty, numQuestions })).pipe(
      map((result: any) => {
        if (result.data.success) {
          const questions = result.data.questions;
          this.currentQuizSubject.next(questions);
          this.quizProgressSubject.next({ current: 0, total: questions.length });
          return questions;
        } else {
          throw new Error('Failed to generate quiz questions');
        }
      }),
      catchError(error => {
        console.error('Error generating quiz questions:', error);
        throw error;
      })
    );
  }

  /**
   * Start a new quiz attempt
   */
  startQuizAttempt(navigatorId: string, topicId: string, topicName: string, questions: QuizQuestion[]): string {
    const attemptId = `${navigatorId}_${topicId}_${Date.now()}`;

    const quizAttempt: Partial<QuizAttempt> = {
      id: attemptId,
      navigatorId,
      topicId,
      topicName,
      questions,
      answers: [],
      startedAt: new Date(),
      score: 0,
      maxScore: questions.length,
      percentage: 0,
      duration: 0
    };

    this.currentQuizAttemptSubject.next(quizAttempt);
    this.quizProgressSubject.next({ current: 0, total: questions.length });

    return attemptId;
  }

  /**
   * Update quiz progress
   */
  updateQuizProgress(currentQuestion: number): void {
    const currentAttempt = this.currentQuizAttemptSubject.value;
    if (currentAttempt && currentAttempt.questions) {
      this.quizProgressSubject.next({
        current: currentQuestion,
        total: currentAttempt.questions.length
      });
    }
  }

  /**
   * Add answer to current quiz attempt
   */
  addAnswerToCurrentAttempt(questionId: string, selectedOptionId: string, timeTaken: number): void {
    const currentAttempt = this.currentQuizAttemptSubject.value;
    if (currentAttempt) {
      const answers = currentAttempt.answers || [];

      // Remove existing answer for this question if any
      const filteredAnswers = answers.filter(a => a.questionId !== questionId);

      // Add new answer (we'll determine correctness during validation)
      filteredAnswers.push({
        questionId,
        selectedOptionId,
        isCorrect: false, // Will be determined during validation
        timeTaken
      });

      const updatedAttempt = {
        ...currentAttempt,
        answers: filteredAnswers
      };

      this.currentQuizAttemptSubject.next(updatedAttempt);
    }
  }

  /**
   * Complete quiz and validate answers
   */
  completeQuiz(): Observable<QuizResult> {
    const currentAttempt = this.currentQuizAttemptSubject.value;

    if (!currentAttempt || !currentAttempt.id || !currentAttempt.questions) {
      throw new Error('No active quiz attempt found');
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - (currentAttempt.startedAt?.getTime() || 0)) / 1000);

    // Calculate score locally for immediate feedback
    let correctAnswers = 0;
    const validatedAnswers = (currentAttempt.answers || []).map(answer => {
      const question = currentAttempt.questions?.find(q => q.id === answer.questionId);
      const isCorrect = question && question.correctAnswerId === answer.selectedOptionId;

      if (isCorrect) {
        correctAnswers++;
      }

      return {
        ...answer,
        isCorrect: !!isCorrect
      };
    });

    const score = correctAnswers;
    const maxScore = currentAttempt.questions.length;
    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= 70;

    // Generate feedback based on performance
    let feedback = '';
    if (percentage >= 90) {
      feedback = 'Excellent work! You have mastered this topic.';
    } else if (percentage >= 80) {
      feedback = 'Great job! You have a solid understanding of this topic.';
    } else if (percentage >= 70) {
      feedback = 'Good work! You passed, but there\'s room for improvement.';
    } else {
      feedback = 'Keep studying! Review the materials and try again.';
    }

    const completedAttempt: QuizAttempt = {
      ...currentAttempt as QuizAttempt,
      answers: validatedAnswers,
      score,
      maxScore,
      percentage,
      completedAt: endTime,
      duration
    };

    const quizResult: QuizResult = {
      attempt: completedAttempt,
      passed,
      feedback,
      nextRecommendation: passed ? 'Try another topic or increase difficulty!' : 'Review the material and try again.'
    };

    // Clear current quiz state
    this.clearCurrentQuiz();

    return from(Promise.resolve(quizResult));
  }

  /**
   * Save quiz attempt to Firebase
   */
  saveQuizAttempt(quizAttempt: QuizAttempt): Observable<{ success: boolean; attemptId: string }> {
    const saveAttempt = httpsCallable(this.functions, 'saveQuizAttempt');

    return from(saveAttempt({
      navigatorId: quizAttempt.navigatorId,
      quizAttempt: {
        ...quizAttempt,
        startedAt: quizAttempt.startedAt.toISOString(),
        completedAt: quizAttempt.completedAt.toISOString()
      }
    })).pipe(
      map((result: any) => {
        if (result.data.success) {
          return {
            success: true,
            attemptId: result.data.attemptId
          };
        } else {
          throw new Error('Failed to save quiz attempt');
        }
      }),
      catchError(error => {
        console.error('Error saving quiz attempt:', error);
        throw error;
      })
    );
  }

  /**
   * Get navigator's quiz statistics
   */
  getNavigatorQuizStats(navigatorId: string): Observable<QuizStats> {
    const getStats = httpsCallable(this.functions, 'getNavigatorQuizStats');

    return from(getStats({ navigatorId })).pipe(
      map((result: any) => {
        if (result.data.success) {
          return result.data.stats;
        } else {
          throw new Error('Failed to fetch quiz statistics');
        }
      }),
      catchError(error => {
        console.error('Error fetching quiz stats:', error);
        throw error;
      })
    );
  }

  /**
   * Clear current quiz state
   */
  clearCurrentQuiz(): void {
    this.currentQuizSubject.next(null);
    this.currentQuizAttemptSubject.next(null);
    this.quizProgressSubject.next(null);
  }

  /**
   * Get current quiz attempt (for components that need access)
   */
  getCurrentQuizAttempt(): Partial<QuizAttempt> | null {
    return this.currentQuizAttemptSubject.value;
  }

  /**
   * Get current questions (for components that need access)
   */
  getCurrentQuestions(): QuizQuestion[] | null {
    return this.currentQuizSubject.value;
  }

  /**
   * Check if there's an active quiz
   */
  hasActiveQuiz(): boolean {
    return this.currentQuizAttemptSubject.value !== null;
  }
}
