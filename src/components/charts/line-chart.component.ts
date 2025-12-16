import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-line-chart',
  template: `<div #chartContainer class="w-full h-full"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements AfterViewInit {
  data = input<{ labels: string[], series: { name: string, data: number[], color: string }[] }>();
  chartContainer = viewChild<ElementRef>('chartContainer');
  
  private svg: any;

  constructor() {
    effect(() => {
        if (this.chartContainer()?.nativeElement && this.data()) {
            this.createChart();
        }
    });
  }

  ngAfterViewInit(): void {
    if (this.data()) {
      this.createChart();
    }
  }

  private createChart(): void {
    const element = this.chartContainer()?.nativeElement;
    if (!element) return;
    const rawData = this.data();
    if (!rawData) return;
    
    d3.select(element).select('svg').remove();
    
    const margin = { top: 20, right: 20, bottom: 60, left: 30 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    const x = d3.scalePoint().domain(rawData.labels).range([0, width]);
    this.svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-40)');

    const yMax = d3.max(rawData.series, s => d3.max(s.data)) || 0;
    const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([height, 0]);
    this.svg.append('g').call(d3.axisLeft(y).ticks(5));

    rawData.series.forEach(s => {
      this.svg.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('d', d3.line<number>()
            .x((d, i) => x(rawData.labels[i]) as number)
            .y(d => y(d))
        );
    });

    const legend = this.svg.append('g')
      .attr('transform', `translate(0, ${height + margin.bottom - 20})`);

    rawData.series.forEach((s, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(${i * 100}, 0)`);
        legendItem.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', s.color);
        legendItem.append('text')
            .attr('x', 15)
            .attr('y', 10)
            .text(s.name)
            .style('font-size', '12px');
    });
  }
}
