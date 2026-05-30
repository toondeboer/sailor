import { TestBed } from '@angular/core/testing';
import { BarAndLineChartComponent } from './bar-and-line-chart.component';

describe('BarAndLineChartComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [BarAndLineChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BarAndLineChartComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
