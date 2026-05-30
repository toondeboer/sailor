import { TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';

describe('SummaryComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SummaryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
