import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz/quiz.service';

import { QuizTopic } from '../../models/quiz.model';
import {AuthService} from '../../services/auth/auth.service';

@Component({
  selector: 'app-navigational-drills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigational-drills.component.html',
  styleUrl: './navigational-drills.component.scss'
})
export class NavigationalDrillsComponent implements OnInit {
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private router = inject(Router);

  quizTopics: QuizTopic[] = [];
  isLoading = false;
  selectedTopic: QuizTopic | null = null;

  ngOnInit(): void {
    this.loadQuizTopics();
  }

  private loadQuizTopics(): void {
    this.quizTopics = this.quizService.getQuizTopics();
  }

  onTopicSelected(topic: QuizTopic): void {
    this.selectedTopic = topic;
  }

  startQuiz(topic: QuizTopic, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    const user = this.authService.currentUser();

    if (!user) {
      // Redirect to login if not authenticated
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    this.quizService.generateQuizQuestions(topic.id, difficulty, 5).subscribe({
      next: (questions) => {
        if (questions && questions.length > 0) {
          // Start quiz attempt
          const attemptId = this.quizService.startQuizAttempt(
            user.uid,
            topic.id,
            topic.name,
            questions
          );

          // Navigate to quiz taking component (we'll create this next)
          this.router.navigate(['/dashboard/navigational-drills/quiz', topic.id]);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error starting quiz:', error);
        this.isLoading = false;
        // Handle error (show notification, etc.)
      }
    });
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '⭐ Easy';
      case 'medium': return '⭐⭐ Medium';
      case 'hard': return '⭐⭐⭐ Hard';
      default: return '⭐⭐ Medium';
    }
  }
}
