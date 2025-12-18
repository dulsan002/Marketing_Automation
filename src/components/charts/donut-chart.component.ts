import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-donut-chart',
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full">
      <div #chartContainer class="w-full h-full"></div>
      <div #tooltip class="absolute bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 z-10" style="white-space: nowrap;"></div>
    </div>
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

    const arc = d3.arc().innerRadius(this.radius * 0.7).outerRadius(this.radius);

    // Paths with animation
    this.svg.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '3px')
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.select(this).transition().duration(200).attr('transform', 'scale(1.05)');
        tooltipDiv.style('opacity', 1)
          .html(`<b>${d.data.range}</b><br/>${d.data.count} Leads`)
          .style('left', (event.pageX - container.getBoundingClientRect().left + 15) + 'px')
          .style('top', (event.pageY - container.getBoundingClientRect().top - 30) + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('transform', 'scale(1)');
        tooltipDiv.style('opacity', 0);
      })
      .transition()
      .duration(1000)
      .attrTween('d', (d: any) => {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t: any) => arc(i(t));
      });

    // Add labels to slices
    this.svg.selectAll('text.slice-label')
      .data(data_ready)
      .join('text')
      .attr('class', 'slice-label')
      .text((d: any) => d.data.count)
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 1);

    // Add central text
    const total = d3.sum(data, d => d.count);
    this.svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .style('font-size', '14px')
      .style('fill', '#6b7280') // text-gray-500
      .text('Total Leads');

    this.svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.0em')
      .style('font-size', '28px')
      .style('font-weight', 'bold')
      .style('fill', '#111827') // text-gray-900
      .text(total);
  }
}
