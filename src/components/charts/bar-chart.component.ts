import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-bar-chart',
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full">
      <div #chartContainer class="w-full h-full"></div>
      
      @if (legend().length > 0) {
        <div class="absolute top-0 right-0 p-2 flex gap-3 pointer-events-none">
          @for (item of legend(); track item.label) {
            <div class="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded shadow-sm border border-gray-100 backdrop-blur-sm">
              <div class="w-3 h-3 rounded-sm" [style.background-color]="item.color"></div>
              <span class="text-xs font-medium text-gray-600">{{ item.label }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit {
  data = input<{ name: string; value: number; color?: string; group?: string }[]>([]);
  legend = input<{ label: string; color: string }[]>([]);
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

    // Safety check for dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

    d3.select(container).select('svg').remove();

    const margin = { top: 40, right: 20, bottom: 60, left: 40 };
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${container.offsetWidth} ${container.offsetHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine if data is grouped
    const isGrouped = data.some(d => d.group);

    // X Axis
    const x0 = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .padding(0.05);

    const y = d3.scaleLinear()
      .rangeRound([height, 0]);

    // Process domains
    if (isGrouped) {
      const groups = Array.from(new Set(data.map(d => d.group))) as string[];
      const subGroups = Array.from(new Set(data.map(d => d.name))) as string[];

      x0.domain(groups);
      x1.domain(subGroups).rangeRound([0, x0.bandwidth()]);
      y.domain([0, d3.max(data, (d: any) => d.value) || 0]).nice();
    } else {
      x0.domain(data.map(d => d.name));
      y.domain([0, d3.max(data, (d: any) => d.value) || 0]).nice();
    }

    // Add Grid Lines (Y-axis)
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('stroke-opacity', 0.1);

    // Render X Axis
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    // Style X Axis Labels
    xAxis.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-30)') // Milder rotation
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#4b5563'); // gray-600

    // Remove domain lines for cleaner look (Enterprise style)
    svg.selectAll('.domain').remove();
    xAxis.selectAll('.tick line').remove();

    // Render Y Axis (Ticks only)
    const yAxis = svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(10));

    yAxis.selectAll('text')
      .style('fill', '#9ca3af') // gray-400
      .style('font-size', '10px');

    // Render Bars
    if (isGrouped) {
      svg.append('g')
        .selectAll('g')
        .data(data)
        .join('rect')
        .attr('transform', (d: any) => `translate(${x0(d.group)},0)`)
        .attr('x', (d: any) => x1(d.name)!)
        .attr('y', (d: any) => {
          const val = y(d.value || 0);
          return isNaN(val) ? height : val;
        })
        .attr('width', x1.bandwidth())
        .attr('height', (d: any) => {
          const yVal = y(d.value || 0);
          const h = height - yVal;
          return isNaN(h) || h < 0 ? 0 : h;
        })
        .attr('fill', (d: any) => d.color || '#3b82f6')
        .attr('rx', 3);
    } else {
      // Original Single Bar Logic
      svg.selectAll('mybar')
        .data(data)
        .join('rect')
        .attr('x', (d: any) => x0(d.name)!)
        .attr('y', (d: any) => y(d.value))
        .attr('width', x0.bandwidth())
        .attr('height', (d: any) => height - y(d.value))
        .attr('fill', (d: any) => d.color || '#3b82f6')
        .attr('rx', 4);
    }
  }
}
