import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioDbo, Stock, Transaction, TransactionKey } from '@aws/util';
import { TransactionsTableComponent } from '../transactions-table/transactions-table.component';

@Component({
  selector: 'aws-portfolio-detail',
  templateUrl: './portfolio-detail.component.html',
  styleUrls: ['./portfolio-detail.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, TransactionsTableComponent],
})
export class PortfolioDetailComponent {
  @Input() portfolio: PortfolioDbo | null = null;
  @Input() stocks: { [ticker: string]: Stock } = {};

  @Output() importCsv = new EventEmitter<string>();

  get portfolioId(): string {
    return this.portfolio?.id ?? 'default';
  }
}
