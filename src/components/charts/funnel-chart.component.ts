import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FunnelStage {
  stage: string;
  count: number;
  rate?: number;
}

@Component({
  selector: 'app-funnel-chart',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full">
      @for (stage of data(); track stage.stage; let i = $index; let isLast = $last) {
        <div class="flex flex-col items-center">
          <!-- Funnel Segment -->
          <div 
            class="relative flex items-center justify-center text-center transition-transform duration-200 hover:scale-105"
            [style.width.px]="220 - i * 40" 
            [style.height.px]="50"
          >
            <div class="absolute inset-0 funnel-segment" [class]="colors[i]"></div>
            <div class="absolute text-white z-10">
              <p class="font-bold text-sm drop-shadow-sm">{{ stage.stage }}</p>
              <p class="text-xs drop-shadow-sm">{{ stage.count | number }}</p>
            </div>
          </div>
          <!-- Conversion Rate Connector -->
          @if (!isLast) {
            <div class="flex flex-col items-center text-xs text-gray-500 font-semibold my-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              @if(stage.rate) {
                <span>{{ data()[i+1].rate | number:'1.1-1' }}%</span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .funnel-segment {
      clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
      filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
    }
    .fill-indigo-600 { background-color: #4f46e5; }
    .fill-indigo-500 { background-color: #6366f1; }
    .fill-purple-500 { background-color: #8b5cf6; }
    .fill-teal-500 { background-color: #14b8a6; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FunnelChartComponent {
  data = input.required<FunnelStage[]>();
  readonly colors = ['fill-indigo-600', 'fill-indigo-500', 'fill-purple-500', 'fill-teal-500'];
}
