import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
