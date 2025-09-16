import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuizService } from '../../../services/quiz/quiz.service';
import { AuthService } from '../../../services/auth/auth.service';
import { QuizQuestion, QuizAttempt, QuizResult, QUIZ_TOPICS } from '../../../models/quiz.model';

@Component({
  selector: 'app-quiz-taking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-taking.component.html',
  styleUrl: './quiz-taking.component.scss'
})
export class QuizTakingComponent implements OnInit, OnDestroy {
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Quiz state
  currentQuizAttempt: Partial<QuizAttempt> | null = null;
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  selectedAnswer: string | null = null;
  answers: { [questionId: string]: string } = {};
  questionStartTime = Date.now();

  // UI state
  isSubmitting = false;
  quizResult: QuizResult | null = null;
  showResult = false;
  topicName = '';
  topicIcon = '';
  topicColor = '';

  // Progress tracking
  progress = { current: 0, total: 0 };

  ngOnInit(): void {
    // Get topic from route params
    const topicId = this.route.snapshot.paramMap.get('topicId');
    if (topicId) {
      const topic = QUIZ_TOPICS.find(t => t.id === topicId);
      if (topic) {
        this.topicName = topic.name;
        this.topicIcon = topic.icon;
        this.topicColor = topic.color;
      }
    }

    // Subscribe to quiz service state
    this.quizService.currentQuizAttempt$
      .pipe(takeUntil(this.destroy$))
      .subscribe(attempt => {
        if (attempt) {
          this.currentQuizAttempt = attempt;
          this.questions = attempt.questions || [];
          this.currentQuestionIndex = 0;
          this.questionStartTime = Date.now();
        } else {
          // No active quiz, redirect back to drills
          this.router.navigate(['/dashboard/navigational-drills']);
        }
      });

    this.quizService.quizProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        if (progress) {
          this.progress = progress;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentQuestion(): QuizQuestion | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get isFirstQuestion(): boolean {
    return this.currentQuestionIndex === 0;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  get progressPercentage(): number {
    if (this.progress.total === 0) return 0;
    return Math.round((this.progress.current / this.progress.total) * 100);
  }

  selectAnswer(optionId: string): void {
    this.selectedAnswer = optionId;

    if (this.currentQuestion) {
      // Store answer for current question
      this.answers[this.currentQuestion.id] = optionId;
    }
  }

  previousQuestion(): void {
    if (!this.isFirstQuestion) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex--;
      this.loadQuestionState();
      this.quizService.updateQuizProgress(this.currentQuestionIndex);
    }
  }

  nextQuestion(): void {
    if (!this.selectedAnswer) return;

    this.saveCurrentAnswer();

    if (this.isLastQuestion) {
      this.completeQuiz();
    } else {
      this.currentQuestionIndex++;
      this.loadQuestionState();
      this.quizService.updateQuizProgress(this.currentQuestionIndex);
    }
  }

  private saveCurrentAnswer(): void {
    if (this.currentQuestion && this.selectedAnswer) {
      const timeTaken = Math.floor((Date.now() - this.questionStartTime) / 1000);

      this.quizService.addAnswerToCurrentAttempt(
        this.currentQuestion.id,
        this.selectedAnswer,
        timeTaken
      );
    }
  }

  private loadQuestionState(): void {
    this.questionStartTime = Date.now();

    if (this.currentQuestion) {
      // Load previously selected answer if any
      this.selectedAnswer = this.answers[this.currentQuestion.id] || null;
    } else {
      this.selectedAnswer = null;
    }
  }

  completeQuiz(): void {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    this.quizService.completeQuiz().subscribe({
      next: (result) => {
        this.quizResult = result;
        this.showResult = true;
        this.isSubmitting = false;

        // Save quiz attempt to Firebase
        this.saveQuizAttempt(result.attempt);
      },
      error: (error) => {
        console.error('Error completing quiz:', error);
        this.isSubmitting = false;
      }
    });
  }

  private saveQuizAttempt(attempt: QuizAttempt): void {
    this.quizService.saveQuizAttempt(attempt).subscribe({
      next: (response) => {
        console.log('Quiz attempt saved:', response.attemptId);
      },
      error: (error) => {
        console.error('Error saving quiz attempt:', error);
      }
    });
  }

  retakeQuiz(): void {
    this.showResult = false;
    this.quizResult = null;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.answers = {};
    this.questionStartTime = Date.now();

    // Navigate back to topic selection
    this.router.navigate(['/dashboard/navigational-drills']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard/helm']);
  }

  tryAnotherTopic(): void {
    this.router.navigate(['/dashboard/navigational-drills']);
  }

  quitQuiz(): void {
    if (confirm('Are you sure you want to quit this quiz? Your progress will be lost.')) {
      this.quizService.clearCurrentQuiz();
      this.router.navigate(['/dashboard/navigational-drills']);
    }
  }

  getScoreClass(): string {
    if (!this.quizResult) return '';

    const percentage = this.quizResult.attempt.percentage;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'pass';
    return 'fail';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
