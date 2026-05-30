import { TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BarChartComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
