import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    const fixture = TestBed.createComponent(TransactionsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
