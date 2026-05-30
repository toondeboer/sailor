import { TestBed } from '@angular/core/testing';
import { ChartComponent } from './chart.component';

describe('ChartComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ChartComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
