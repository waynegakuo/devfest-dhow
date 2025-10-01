import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MessageFormatterPipe } from '../../pipes/message-formatter.pipe';

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

  // Chat state
  messages = signal<OracleMessage[]>([]);
  currentMessage = signal('');
  isTyping = signal(false);

  // Dummy conference data for responses
  private conferenceData = {
    schedule: [
      { time: '09:00', session: 'Opening Keynote: The Future of AI', speaker: 'Dr. Sarah Chen' },
      { time: '10:30', session: 'Building with Firebase & AI', speaker: 'Wayne Gakuo' },
      { time: '14:00', session: 'Machine Learning at Scale', speaker: 'Prof. Michael Roberts' },
      { time: '15:30', session: 'Android Development Workshop', speaker: 'Jessica Kim' }
    ],
    speakers: [
      { name: 'Dr. Sarah Chen', expertise: 'AI Research', company: 'Google DeepMind' },
      { name: 'Wayne Gakuo', expertise: 'Firebase & AI Integration', company: 'DevFest Pwani' },
      { name: 'Prof. Michael Roberts', expertise: 'Machine Learning', company: 'Stanford University' }
    ],
    venue: {
      name: 'Pwani University Convention Center',
      address: 'Kilifi, Kenya',
      wifi: 'DevFest2025',
      parking: 'Available on-site with shuttle service'
    },
    tracks: [
      'AI & Machine Learning',
      'Android Development',
      'Web Development',
      'Cloud Technologies',
      'Firebase Integration'
    ]
  };

  ngOnInit() {
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

    // Simulate AI response delay
    setTimeout(() => {
      const response = this.generateOracleResponse(messageContent);
      this.addMessage({
        id: this.generateId(),
        content: response,
        isUser: false,
        timestamp: new Date()
      });
      this.isTyping.set(false);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
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

  private generateOracleResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();

    // Schedule related queries
    if (message.includes('schedule') || message.includes('time') || message.includes('when')) {
      return this.getScheduleResponse(message);
    }

    // Speaker related queries
    if (message.includes('speaker') || message.includes('who') || message.includes('presenter')) {
      return this.getSpeakerResponse(message);
    }

    // Venue related queries
    if (message.includes('venue') || message.includes('location') || message.includes('where') || message.includes('parking') || message.includes('wifi')) {
      return this.getVenueResponse(message);
    }

    // Track related queries
    if (message.includes('track') || message.includes('topic') || message.includes('session')) {
      return this.getTrackResponse();
    }

    // Registration and tickets
    if (message.includes('register') || message.includes('ticket') || message.includes('cost') || message.includes('price')) {
      return "🎫 Registration for DevFest Pwani 2025 is completely FREE! Simply visit our registration portal and secure your spot. Early registration gets you exclusive swag and priority seating. Don't let this voyage sail without you aboard!";
    }

    // Food and refreshments
    if (message.includes('food') || message.includes('lunch') || message.includes('coffee') || message.includes('meal')) {
      return "🍽️ Our galley will be well-stocked! Complimentary breakfast, lunch, and coffee breaks are included. We'll have local Kenyan dishes alongside international options. Special dietary requirements? Let the crew know during registration - we sail together, we eat together!";
    }

    // Networking
    if (message.includes('network') || message.includes('meet') || message.includes('connect')) {
      return "🤝 DevFest Dhow is the perfect waters for networking! We have dedicated networking breaks, a community lounge, and interactive sessions. Don't forget to bring business cards and join our WhatsApp community for post-event connections. The real treasure is the navigators you meet along the way!";
    }

    // Swag and prizes
    if (message.includes('swag') || message.includes('prize') || message.includes('gift') || message.includes('merch')) {
      return "🎁 Ahoy! Every navigator receives exclusive DevFest Dhow swag including t-shirts, stickers, and special edition items. We'll have contests throughout the day with tech gadgets, Google merchandise, and surprise prizes. The early birds get the best treasures!";
    }

    // Default responses with conference context
    const defaultResponses = [
      "🌊 That's an interesting question, Navigator! DevFest Pwani 2025 will be an incredible journey of learning and discovery. Could you be more specific about what aspect of the conference interests you most?",
      "⚓ The Oracle sees many possibilities in your question! DevFest Dhow brings together the brightest minds in tech. What specific information about the conference can I help you navigate?",
      "🧭 Your inquiry reaches across the digital seas! DevFest Pwani 2025 will feature cutting-edge tech talks, hands-on workshops, and amazing networking opportunities. What would you like to know more about?",
      "🔮 The crystal ball reveals... you're curious about DevFest! This year's event promises to be our biggest yet, with world-class speakers and innovative sessions. Is there a particular topic or aspect you'd like to explore?",
      "⛵ Fair winds bring good questions! DevFest Dhow 2025 will chart new territories in AI, mobile development, and cloud technologies. What specific aspect of the conference voyage interests you most?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private getScheduleResponse(message: string): string {
    const scheduleText = this.conferenceData.schedule
      .map(item => `${item.time} - ${item.session} (${item.speaker})`)
      .join('\n');

    return `📅 Here's the DevFest Dhow 2025 schedule:\n\n${scheduleText}\n\nAll sessions will be packed with insights and hands-on learning. Which session catches your eye, Navigator?`;
  }

  private getSpeakerResponse(message: string): string {
    const speakersText = this.conferenceData.speakers
      .map(speaker => `🎤 ${speaker.name} - ${speaker.expertise} at ${speaker.company}`)
      .join('\n');

    return `Here are our distinguished speakers for DevFest Dhow 2025:\n\n${speakersText}\n\nEach brings years of experience and cutting-edge insights. Any particular speaker you're excited to hear from?`;
  }

  private getVenueResponse(message: string): string {
    const venue = this.conferenceData.venue;

    if (message.includes('wifi')) {
      return `📶 WiFi Network: "${venue.wifi}" - High-speed internet throughout the venue to keep you connected during the voyage!`;
    }

    if (message.includes('parking')) {
      return `🚗 ${venue.parking}. We recommend carpooling with fellow navigators to reduce the environmental wake of our journey!`;
    }

    return `📍 DevFest Dhow 2025 will dock at:\n\n${venue.name}\n${venue.address}\n\n🅿️ Parking: ${venue.parking}\n📶 WiFi: "${venue.wifi}"\n\nThe venue is fully equipped for an amazing conference experience!`;
  }

  private getTrackResponse(): string {
    const tracksText = this.conferenceData.tracks
      .map((track, index) => `${index + 1}. ${track}`)
      .join('\n');

    return `🛤️ DevFest Dhow 2025 features these exciting tracks:\n\n${tracksText}\n\nEach track offers deep dives into cutting-edge technologies. Which voyage interests you most, Navigator?`;
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
}
