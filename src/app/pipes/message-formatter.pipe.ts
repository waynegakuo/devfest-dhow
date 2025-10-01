import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageFormatter',
  standalone: true
})
export class MessageFormatterPipe implements PipeTransform {

  transform(message: string): string {
    if (!message) return '';

    // Convert newlines to <br> tags for proper HTML display
    let formatted = message.replace(/\n/g, '<br>');

    // Make text between asterisks bold (e.g., *important* -> <strong>important</strong>)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    // Format bullet points with proper spacing
    formatted = formatted.replace(/^• /gm, '<span style="color: var(--ocean-blue); font-weight: bold;">•</span> ');

    // Format numbers at start of lines (for numbered lists)
    formatted = formatted.replace(/^(\d+)\. /gm, '<span style="color: var(--magenta-violet); font-weight: bold;">$1.</span> ');

    return formatted;
  }
}
