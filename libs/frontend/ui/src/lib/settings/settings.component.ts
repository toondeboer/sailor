import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectBaseCurrency, updateSettings } from '@aws/state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD'];

@Component({
  selector: 'aws-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatCardModule],
})
export class SettingsComponent implements OnInit {
  currencies = SUPPORTED_CURRENCIES;
  selectedCurrency = 'EUR';

  baseCurrency$ = this.store.select(selectBaseCurrency);

  constructor(private store: Store) {}

  ngOnInit() {
    this.baseCurrency$.subscribe((currency) => {
      this.selectedCurrency = currency;
    });
  }

  onCurrencyChange(currency: string) {
    this.store.dispatch(updateSettings({ settings: { baseCurrency: currency } }));
  }
}
