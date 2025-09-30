import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuizService } from '../../../services/quiz/quiz.service';
import { AuthService } from '../../../services/auth/auth.service';
import {QuizQuestion, QuizAttempt, QuizResult, QUIZ_TOPICS, QuizAnswer} from '../../../models/quiz.model';

@Component({
  selector: 'app-quiz-taking',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
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
          this.questionStartTime = Date.now();
        } else {
          // No active quiz, redirect back to drills
          // if(!this.showResult && !this.quizResult) {
          //   this.router.navigate(['/dashboard/navigational-drills']);
          // }
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

    // Save the answer for the last question before completing the quiz
    this.saveCurrentAnswer();

    // Update progress to 100% when completing the quiz
    this.quizService.updateQuizProgress(this.questions.length - 1);

    this.isSubmitting = true;
    console.log('Attempting to complete quiz...');

    this.quizService.completeQuiz().subscribe({
      next: (result) => {
        console.log('Quiz completed successfully:', result);
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

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '⭐ Easy';
      case 'medium': return '⭐⭐ Medium';
      case 'hard': return '⭐⭐⭐ Hard';
      default: return '⭐⭐ Medium';
    }
  }

  // Enhanced analytics methods
  getCorrectAnswersCount(): number {
    return this.quizResult?.attempt.answers.filter(answer => answer.isCorrect).length || 0;
  }

  getIncorrectAnswersCount(): number {
    return this.quizResult?.attempt.answers.filter(answer => !answer.isCorrect).length || 0;
  }

  getAccuracyClass(): string {
    if (!this.quizResult) return '';
    const percentage = this.quizResult.attempt.percentage;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'pass';
    return 'fail';
  }

  getAverageTimePerQuestion(): number {
    if (!this.quizResult || !this.quizResult.attempt.answers.length) return 0;
    const totalTime = this.quizResult.attempt.answers.reduce((sum, answer) => sum + answer.timeTaken, 0);
    return Math.round(totalTime / this.quizResult.attempt.answers.length);
  }

  getFastestAnswerTime(): number {
    if (!this.quizResult || !this.quizResult.attempt.answers.length) return 0;
    return Math.min(...this.quizResult.attempt.answers.map(answer => answer.timeTaken));
  }

  getSlowestAnswerTime(): number {
    if (!this.quizResult || !this.quizResult.attempt.answers.length) return 0;
    return Math.max(...this.quizResult.attempt.answers.map(answer => answer.timeTaken));
  }

  // Helper method to safely find an answer for a question
  getAnswerForQuestion(questionId: string): QuizAnswer | undefined {
    if (!this.quizResult) return undefined;
    return this.quizResult.attempt.answers.find(a => a.questionId === questionId);
  }

  isAnswerCorrect(index: number): boolean {
    if (!this.quizResult || !this.quizResult.attempt.answers[index]) return false;
    return this.quizResult.attempt.answers[index].isCorrect;
  }

  getAnswerTimeTaken(index: number): number {
    if (!this.quizResult || !this.quizResult.attempt.answers[index]) return 0;
    return this.quizResult.attempt.answers[index].timeTaken;
  }

  getSelectedOptionId(index: number): string {
    if (!this.quizResult || !this.quizResult.attempt.answers[index]) return '';
    return this.quizResult.attempt.answers[index].selectedOptionId;
  }

  getDifficultyStats(): Array<{difficulty: string, accuracy: number, count: number}> {
    if (!this.quizResult) return [];

    const difficultyMap = new Map<string, {correct: number, total: number}>();

    this.quizResult.attempt.questions.forEach((question) => {
      const difficulty = question.difficulty;
      // Find the matching answer for this question by questionId
      const answer = this.getAnswerForQuestion(question.id);

      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, {correct: 0, total: 0});
      }

      const stats = difficultyMap.get(difficulty)!;
      stats.total++;
      // Only increment correct count if we have a matching answer and it's correct
      if (answer && answer.isCorrect) stats.correct++;
    });

    return Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
      difficulty,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      count: stats.total
    }));
  }

  getMasteryLevel(): string {
    if (!this.quizResult) return 'novice';
    const percentage = this.quizResult.attempt.percentage;
    if (percentage >= 90) return 'master';
    if (percentage >= 80) return 'expert';
    if (percentage >= 70) return 'proficient';
    return 'novice';
  }

  getMasteryDescription(): string {
    if (!this.quizResult) return '';
    const level = this.getMasteryLevel();
    const topic = this.topicName;

    switch (level) {
      case 'master': return `You've achieved mastery in ${topic}! You're ready to teach others.`;
      case 'expert': return `You have expert-level knowledge of ${topic}. Great job!`;
      case 'proficient': return `You're proficient in ${topic} fundamentals. Keep building on this foundation.`;
      case 'novice': return `You're beginning your ${topic} journey. Practice will help you improve.`;
      default: return '';
    }
  }

  getImprovementTips(): Array<{area: string, description: string, icon: string, priority: string}> {
    if (!this.quizResult) return [];

    const tips: Array<{area: string, description: string, icon: string, priority: string}> = [];
    const percentage = this.quizResult.attempt.percentage;
    const avgTime = this.getAverageTimePerQuestion();
    const diffStats = this.getDifficultyStats();

    // Time-based tips
    if (avgTime > 120) {
      tips.push({
        area: 'Response Time',
        description: 'Consider reviewing the material to improve your response confidence.',
        icon: '⚡',
        priority: 'medium'
      });
    }

    // Accuracy-based tips
    if (percentage < 70) {
      tips.push({
        area: 'Core Concepts',
        description: 'Focus on understanding the fundamental concepts before attempting again.',
        icon: '📚',
        priority: 'high'
      });
    }

    // Difficulty-specific tips
    const weakestDifficulty = diffStats.find(stat => stat.accuracy < 50);
    if (weakestDifficulty) {
      tips.push({
        area: `${this.getDifficultyLabel(weakestDifficulty.difficulty)} Questions`,
        description: `Practice more ${weakestDifficulty.difficulty} level questions to improve your understanding.`,
        icon: '🎯',
        priority: 'high'
      });
    }

    // Success tips
    if (percentage >= 90) {
      tips.push({
        area: 'Challenge Yourself',
        description: 'Try exploring more advanced topics or help other navigators learn!',
        icon: '🚀',
        priority: 'low'
      });
    }

    return tips.length > 0 ? tips : [{
      area: 'Keep Learning',
      description: 'Every quiz attempt helps you grow. Keep exploring and practicing!',
      icon: '🌟',
      priority: 'low'
    }];
  }

  getLearningTrajectory(): string {
    if (!this.quizResult) return 'Starting your journey';
    const percentage = this.quizResult.attempt.percentage;
    const avgTime = this.getAverageTimePerQuestion();

    if (percentage >= 90 && avgTime <= 60) return 'Rapid mastery';
    if (percentage >= 80 && avgTime <= 90) return 'Steady progress';
    if (percentage >= 70) return 'Building foundations';
    if (percentage >= 50) return 'Finding your way';
    return 'Beginning exploration';
  }

  getNextSteps(): Array<{
    title: string;
    description: string;
    icon: string;
    priority: string;
    actionable: boolean;
    actionText?: string;
    action?: () => void;
  }> {
    if (!this.quizResult) return [];

    const steps: Array<any> = [];
    const percentage = this.quizResult.attempt.percentage;
    const mastery = this.getMasteryLevel();

    // Based on performance level
    if (percentage >= 90) {
      steps.push({
        title: 'Explore Advanced Topics',
        description: 'Challenge yourself with more complex AI concepts and frameworks.',
        icon: '🎆',
        priority: 'high',
        actionable: true,
        actionText: 'Browse Topics',
        action: () => this.tryAnotherTopic()
      });

      steps.push({
        title: 'Help Other Navigators',
        description: 'Share your knowledge and help others on their AI journey.',
        icon: '🤝',
        priority: 'medium',
        actionable: false
      });
    } else if (percentage >= 70) {
      steps.push({
        title: 'Practice Similar Questions',
        description: 'Strengthen your understanding with more practice in this topic.',
        icon: '💪',
        priority: 'high',
        actionable: true,
        actionText: 'Retry Quiz',
        action: () => this.retakeQuiz()
      });

      steps.push({
        title: 'Review Core Concepts',
        description: 'Dive deeper into the fundamental concepts you found challenging.',
        icon: '📚',
        priority: 'medium',
        actionable: false
      });
    } else {
      steps.push({
        title: 'Study the Basics',
        description: 'Focus on understanding the core concepts before attempting again.',
        icon: '🎯',
        priority: 'high',
        actionable: false
      });

      steps.push({
        title: 'Start with Easier Topics',
        description: 'Build confidence with foundational topics before tackling advanced ones.',
        icon: '🌱',
        priority: 'medium',
        actionable: true,
        actionText: 'Browse Topics',
        action: () => this.tryAnotherTopic()
      });
    }

    // Always suggest exploring other topics
    steps.push({
      title: 'Explore Related Topics',
      description: `Discover how ${this.topicName} connects to other AI technologies.`,
      icon: '🌍',
      priority: 'low',
      actionable: true,
      actionText: 'Explore',
      action: () => this.tryAnotherTopic()
    });

    return steps;
  }

  // Social sharing methods
  shareOnTwitter(): void {
    if (!this.quizResult) return;

    const score = this.quizResult.attempt.percentage;
    const level = this.getMasteryLevel();
    const topic = this.topicName;

    let message = '';
    if (score >= 90) {
      message = `🏆 Just mastered ${topic} with ${score}% accuracy! Achieved ${level} level on DevFest Dhow! 🎆 #AI #DevFest #TechSkills #${topic.replace(/\s+/g, '')}`;
    } else if (score >= 80) {
      message = `🎯 Great progress in ${topic}! Scored ${score}% and reached ${level} level on DevFest Dhow! 🚀 #AI #Learning #DevFest #${topic.replace(/\s+/g, '')}`;
    } else if (score >= 70) {
      message = `✅ Passed the ${topic} challenge with ${score}%! Building my AI knowledge on DevFest Dhow 🌱 #AI #TechLearning #DevFest`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(twitterUrl, '_blank');
  }

  shareOnLinkedIn(): void {
    if (!this.quizResult) return;

    const score = this.quizResult.attempt.percentage;
    const level = this.getMasteryLevel();
    const topic = this.topicName;

    let message = '';
    if (score >= 90) {
      message = `Excited to share my latest learning milestone! I just achieved ${level} level in ${topic} with ${score}% accuracy on DevFest Dhow. The interactive AI quizzes are helping me stay current with cutting-edge technology. #ArtificialIntelligence #ProfessionalDevelopment #TechSkills #ContinuousLearning`;
    } else if (score >= 80) {
      message = `Making great progress in my AI learning journey! Scored ${score}% in ${topic} and reached ${level} level on DevFest Dhow. These hands-on challenges are perfect for staying updated with the latest in AI technology. #AI #TechLearning #ProfessionalGrowth`;
    } else if (score >= 70) {
      message = `Just completed the ${topic} challenge on DevFest Dhow with a ${score}% score! Investing in continuous learning and staying current with AI technologies. #AI #LearningJourney #TechSkills`;
    }

    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(message)}`;
    window.open(linkedinUrl, '_blank');
  }

  async copyResultsLink(): Promise<void> {
    if (!this.quizResult) return;

    const score = this.quizResult.attempt.percentage;
    const level = this.getMasteryLevel();
    const topic = this.topicName;
    const duration = this.formatTime(this.quizResult.attempt.duration);
    const correct = this.getCorrectAnswersCount();
    const total = this.quizResult.attempt.maxScore;

    const summary = `🏆 DevFest Dhow - ${topic} Quiz Results
` +
                   `• Score: ${score}% (${correct}/${total} correct)
` +
                   `• Time: ${duration}
` +
                   `• Level: ${level.charAt(0).toUpperCase() + level.slice(1)}
` +
                   `• Status: ${this.quizResult.passed ? 'PASSED' : 'Keep Learning'}
\n` +
                   `🚀 Challenge yourself with AI quizzes at DevFest Dhow!
` +
                   `#AI #TechSkills #DevFest #Learning`;

    try {
      await navigator.clipboard.writeText(summary);
      // You could show a toast notification here
      console.log('Results copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: create a temporary text area
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}
