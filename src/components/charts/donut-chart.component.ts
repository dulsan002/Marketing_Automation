import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-donut-chart',
  imports: [CommonModule],
  template: `
    <div #chartContainer class="w-full h-full relative"></div>
    <div #tooltip class="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 pointer-events-none transition-opacity duration-200"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent implements AfterViewInit {
  data = input<any[]>([]);
  chartContainer = viewChild<ElementRef>('chartContainer');
  tooltip = viewChild<ElementRef>('tooltip');

  private svg: any;
  private readonly width = 320;
  private readonly height = 320;
  private readonly margin = 10;
  private readonly radius = Math.min(this.width, this.height) / 2 - this.margin;

  constructor() {
    effect(() => {
      if (this.chartContainer()?.nativeElement && this.data().length > 0) {
        this.createChart(this.data());
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.data().length > 0) {
      this.createChart(this.data());
    }
  }

  private createChart(data: any[]): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    d3.select(container).select('svg').remove();
    
    const tooltipDiv = d3.select(this.tooltip()?.nativeElement);

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    const pie = d3.pie<any>().value((d: any) => d.count).sort(null);
    const data_ready = pie(data);

    const arc = d3.arc().innerRadius(this.radius * 0.6).outerRadius(this.radius);

    this.svg.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', (event: MouseEvent, d: any) => {
        tooltipDiv.style('opacity', 1)
                  .html(`Range: ${d.data.range}<br/>Leads: ${d.data.count}`)
                  .style('left', (event.offsetX + 10) + 'px')
                  .style('top', (event.offsetY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltipDiv.style('opacity', 0);
      });
  }
}