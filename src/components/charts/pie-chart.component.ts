import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-pie-chart',
  imports: [CommonModule],
  template: `
    <div #chartContainer class="w-full h-full relative"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit {
  data = input<any[]>([]);
  chartContainer = viewChild<ElementRef>('chartContainer');

  private svg: any;

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

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const radius = Math.min(width, height) / 2;

    this.svg = d3.select(container)
      .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<any>().value((d: any) => d.value).sort(null);
    const data_ready = pie(data);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    this.svg
      .selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Add labels
    const labelArc = d3.arc().innerRadius(radius * 0.7).outerRadius(radius * 0.7);
    this.svg.selectAll('text')
        .data(data_ready)
        .join('text')
        .text((d: any) => `${d.data.name}`)
        .attr('transform', (d: any) => `translate(${labelArc.centroid(d)})`)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', 'white');
  }
}