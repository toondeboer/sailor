import { TestBed } from '@angular/core/testing';
import { BarChartPerQuarterByYearComponent } from './bar-chart-per-quarter-by-year';

describe('BarChartPerQuarterByYearComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartPerQuarterByYearComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BarChartPerQuarterByYearComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
