import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-bar-chart',
  imports: [CommonModule],
  template: `
    <div #chartContainer class="w-full h-full relative"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit {
  data = input<{ name: string; value: number; color?: string }[]>([]);
  chartContainer = viewChild<ElementRef>('chartContainer');

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

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${container.offsetWidth} ${container.offsetHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.name))
      .padding(0.2);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: any) => d.value) || 0])
      .range([height, 0]);

    svg.append('g')
      .call(d3.axisLeft(y));

    // Bars
    svg.selectAll('mybar')
      .data(data)
      .join('rect')
      .attr('x', (d: any) => x(d.name)!)
      .attr('y', (d: any) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => height - y(d.value))
      .attr('fill', (d: any) => d.color || '#3b82f6')
      .attr('rx', 4); // rounded corners
  }
}
