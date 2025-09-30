import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { QuizService } from '../../services/quiz/quiz.service';
import { AuthService } from '../../services/auth/auth.service';
import { QuizAttempt, QUIZ_TOPICS } from '../../models/quiz.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-quiz-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './quiz-history.component.html',
  styleUrl: './quiz-history.component.scss'
})
export class QuizHistoryComponent implements OnInit, OnDestroy {
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  quizHistory: QuizAttempt[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadQuizHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQuizHistory(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.errorMessage = 'Please log in to view your quiz history.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.quizService.getNavigatorQuizHistory(currentUser.uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.quizHistory = history;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading quiz history:', error);
          this.errorMessage = 'Failed to load quiz history. Please try again later.';
          this.isLoading = false;
        }
      });
  }

  getQuizTopicIcon(topicId: string): string {
    const topic = QUIZ_TOPICS.find(t => t.id === topicId);
    return topic?.icon || '📝';
  }

  getQuizTopicColor(topicId: string): string {
    const topic = QUIZ_TOPICS.find(t => t.id === topicId);
    return topic?.color || '#9e9e9e';
  }

  getResultClass(percentage: number): string {
    if (percentage >= 90) return 'excellent-result';
    if (percentage >= 80) return 'great-result';
    if (percentage >= 70) return 'good-result';
    if (percentage >= 60) return 'fair-result';
    return 'needs-improvement-result';
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (minutes === 1 && remainingSeconds === 0) {
      return '1 minute';
    } else if (remainingSeconds === 0) {
      return `${minutes} minutes`;
    } else {
      return `${minutes} min ${remainingSeconds} sec`;
    }
  }
}
