import { ChangeDetectionStrategy, Component, ElementRef, input, AfterViewInit, viewChild, effect, SimpleChanges, OnChanges } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-bar-chart',
  template: `<div #chartContainer class="w-full h-full"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit, OnChanges {
  data = input<any[]>([]);
  chartContainer = viewChild<ElementRef>('chartContainer');
  
  private svg: any;

  constructor() {
    effect(() => {
        if (this.chartContainer()?.nativeElement && this.data() && this.data().length > 0) {
            this.createChart();
        }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['data'] && this.svg) {
          this.createChart();
      }
  }

  ngAfterViewInit(): void {
    if (this.data()) {
      this.createChart();
    }
  }

  private createChart(): void {
    const element = this.chartContainer()?.nativeElement;
    if (!element) return;
    const data = this.data();
    if (!data || data.length === 0) return;

    d3.select(element).select('svg').remove();
    
    const keys = Object.keys(data[0]).filter(key => key !== 'name');
    const groupKey = 'name';

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(data.map(d => d[groupKey]))
      .rangeRound([0, width])
      .paddingInner(0.2);

    const x1 = d3.scaleBand()
      .domain(keys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const yMax = d3.max(data, d => d3.max(keys, key => d[key])) || 0;
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]).nice()
      .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(['#3B82F6', '#14B8A6']);

    this.svg.append('g')
      .selectAll('g')
      .data(data)
      .join('g')
        .attr('transform', d => `translate(${x0(d[groupKey])},0)`)
      .selectAll('rect')
      .data(d => keys.map(key => ({key, value: d[key]})))
      .join('rect')
        .attr('x', d => x1(d.key) as number)
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => color(d.key) as string);

    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0));
      
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(5));

    const legend = this.svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(keys.slice().reverse())
      .join('g')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
        .attr('x', width - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', color as any);

    legend.append('text')
        .attr('x', width - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .text(d => d);
  }
}