import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AiService {

    constructor() { }

    /**
     * Generates catchy email subject lines based on a topic or keywords.
     */
    generateSubjectLines(topic: string): Observable<string[]> {
        const suggestions = [
            `Unlock the power of ${topic}`,
            `Your guide to mastering ${topic}`,
            `Exclusive: ${topic} insights inside`,
            `Don't miss out on ${topic} trends`,
            `The future of ${topic} is here`
        ];
        return of(suggestions).pipe(delay(1500)); // Simulate API network latency
    }

    /**
     * Generates email body content based on a type and topic.
     */
    generateEmailContent(type: string, topic: string): Observable<string> {
        const content = `
      <p>Hi there,</p>
      <p>We are excited to share the latest updates on <strong>${topic}</strong>.</p>
      <p>This ${type} is designed to help you achieve more with less effort.</p>
      <p>Click below to get started!</p>
      <br>
      <p>Best,<br>The RevOps Team</p>
    `;
        return of(content).pipe(delay(2000));
    }
}
