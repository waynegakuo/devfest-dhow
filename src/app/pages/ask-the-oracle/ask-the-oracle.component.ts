import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MessageFormatterPipe } from '../../pipes/message-formatter.pipe';
import { AskTheOracleService } from '../../services/ask-the-oracle/ask-the-oracle.service';
import { SeoService } from '../../services/seo/seo.service';
import { AnalyticsService } from '../../services/analytics/analytics.service';

export interface OracleMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  typing?: boolean;
}

@Component({
  selector: 'app-ask-the-oracle',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageFormatterPipe],
  templateUrl: './ask-the-oracle.component.html',
  styleUrl: './ask-the-oracle.component.scss'
})
export class AskTheOracleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private oracleService = inject(AskTheOracleService);
  private seoService = inject(SeoService);
  private analyticsService = inject(AnalyticsService);

  // Chat state
  messages = signal<OracleMessage[]>([]);
  currentMessage = signal('');
  isTyping = signal(false);
  showTips = signal(false);

  ngOnInit() {
    this.seoService.setMetaTags({
      title: 'Ask the Oracle | DevFest Pwani 2025',
      description: 'Get instant answers to your questions about DevFest Pwani 2025. Ask our AI-powered Oracle about sessions, speakers, schedules, and more.',
      ogImageUrl: 'https://devfest-dhow.web.app/assets/logo/devfest-dhow-emblem.png'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Ask the Oracle | DevFest Pwani 2025',
      'description': 'Your personal AI guide to the DevFest Pwani 2025 conference. Get real-time information about the event.',
      'url': 'https://devfest-dhow.web.app/ask-the-oracle'
    });

    // Initialize with welcome message
    this.addMessage({
      id: this.generateId(),
      content: "🔮 Greetings, Navigator! I am the Oracle of DevFest Dhow, powered by Gemini AI. I'm here to help you navigate the conference waters. Ask me about schedules, speakers, venue information, or anything related to DevFest Pwani 2025!",
      isUser: false,
      timestamp: new Date()
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage() {
    const messageContent = this.currentMessage().trim();
    if (!messageContent) return;

    // Log the custom event
    this.analyticsService.logEvent('ask_oracle', {
      question: messageContent
    });

    // Add user message
    this.addMessage({
      id: this.generateId(),
      content: messageContent,
      isUser: true,
      timestamp: new Date()
    });

    // Clear input
    this.currentMessage.set('');

    // Show typing indicator
    this.isTyping.set(true);

    this.oracleService.askQuestion(messageContent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.addMessage({
            id: this.generateId(),
            content: response.data.answer,
            isUser: false,
            timestamp: new Date()
          });
          this.isTyping.set(false);
        },
        error: (error) => {
          console.error('Error calling askTheOracle:', error);
          this.addMessage({
            id: this.generateId(),
            content: "I'm sorry, I'm having trouble connecting to the oracle. Please try again later.",
            isUser: false,
            timestamp: new Date()
          });
          this.isTyping.set(false);
        }
      });
  }

  private addMessage(message: OracleMessage) {
    this.messages.update(messages => [...messages, message]);
    // Auto-scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private scrollToBottom() {
    const chatContainer = document.querySelector('.oracle-chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages.set([]);
    this.ngOnInit(); // Reinitialize with welcome message
  }

  toggleTips() {
    this.showTips.update(value => !value);
  }
}
