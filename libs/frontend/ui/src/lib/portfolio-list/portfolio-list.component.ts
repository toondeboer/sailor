import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PortfolioDbo } from '@aws/util';

@Component({
  selector: 'aws-portfolio-list',
  templateUrl: './portfolio-list.component.html',
  styleUrls: ['./portfolio-list.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class PortfolioListComponent {
  @Input() portfolios: PortfolioDbo[] = [];
  @Input() selectedPortfolioId: string | null = null;

  @Output() selectPortfolio = new EventEmitter<string>();
  @Output() createPortfolio = new EventEmitter<void>();
  @Output() renamePortfolio = new EventEmitter<PortfolioDbo>();
  @Output() deletePortfolio = new EventEmitter<PortfolioDbo>();

  transactionCount(portfolio: PortfolioDbo): number {
    return (
      portfolio.transactions.stock.length +
      portfolio.transactions.dividend.length +
      portfolio.transactions.commission.length
    );
  }
}
