import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TransactionsTableComponent } from './transactions-table.component';

describe('TransactionsTableComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsTableComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    const fixture = TestBed.createComponent(TransactionsTableComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
