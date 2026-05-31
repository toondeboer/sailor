import { Component } from '@angular/core';
import {
  selectBaseCurrency,
  selectPortfoliosDbo,
  selectSelectedPortfolioIds,
  selectState,
  setSelectedPortfolios,
} from '@aws/state';
import { Store } from '@ngrx/store';
import { SummaryComponent } from '../summary/summary.component';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ActiveTickersComponent } from '../active-tickers/active-tickers.component';

@Component({
  selector: 'aws-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [SummaryComponent, AsyncPipe, CommonModule, DatePipe, ActiveTickersComponent],
})
export class DashboardComponent {
  state$ = this.store.select(selectState);
  portfolios$ = this.store.select(selectPortfoliosDbo);
  selectedPortfolioIds$ = this.store.select(selectSelectedPortfolioIds);
  baseCurrency$ = this.store.select(selectBaseCurrency);

  constructor(private store: Store) {}

  isPortfolioActive(portfolioId: string, selectedIds: string[] | 'all'): boolean {
    return selectedIds === 'all' || selectedIds.includes(portfolioId);
  }

  portfolioIds(portfolios: { id: string }[]): string[] {
    return portfolios.map((p) => p.id);
  }

  togglePortfolio(portfolioId: string, selectedIds: string[] | 'all', allIds: string[]) {
    let current = selectedIds === 'all' ? [...allIds] : [...selectedIds];
    if (current.includes(portfolioId)) {
      current = current.filter((id) => id !== portfolioId);
    } else {
      current = [...current, portfolioId];
    }
    const ids = current.length === allIds.length ? 'all' : current;
    this.store.dispatch(setSelectedPortfolios({ ids }));
  }
}
