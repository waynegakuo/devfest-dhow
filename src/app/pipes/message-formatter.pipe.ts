import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'messageFormatter',
  standalone: true
})
export class MessageFormatterPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(message: string): SafeHtml {
    if (!message) return '';

    let formatted = message;

    // Process headers first (from h3 to h1 to avoid conflicts)
    formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Process links: [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (url.includes('maps.app.goo.gl')) {
        const lat = -4.026;
        const lon = 39.68;
        const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=16&size=400x200&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
        return `<div class="map-preview" style="margin-top: 8px; margin-bottom: 8px;">
                  <a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                    <img src="${staticMapUrl}" alt="Map preview of ${text}" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc;">
                    <div style="text-align: center; margin-top: 4px; color: var(--cyan-blue); text-decoration: underline;">${text}</div>
                  </a>
                </div>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan-blue); text-decoration: underline;">${text}</a>`;
    });

    // Process bold text: **text** or *text*
    formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');

    // Process lists
    // Unordered lists: *, •, or -
    formatted = formatted.replace(/^[\*•-] /gm, '<span style="color: var(--ocean-blue); font-weight: bold;">•</span> ');
    // Numbered lists: 1.
    formatted = formatted.replace(/^(\d+)\. /gm, '<span style="color: var(--magenta-violet); font-weight: bold;">$1.</span> ');

    // Finally, handle newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
