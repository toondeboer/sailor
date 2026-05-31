import { Component } from '@angular/core';
import { selectState } from '@aws/state';
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

  constructor(private store: Store) {}
}
