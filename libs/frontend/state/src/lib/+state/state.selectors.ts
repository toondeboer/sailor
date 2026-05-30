import { createFeatureSelector, createSelector } from '@ngrx/store';
import { computePortfolioState } from '@aws/util';
import { FeatureState, featureKey } from './state.reducer';

export const selectFeature = createFeatureSelector<FeatureState>(featureKey);

const selectTransactionsDbo = createSelector(
  selectFeature,
  (state: FeatureState) => state.transactionsDbo
);

const selectTickers = createSelector(
  selectFeature,
  (state: FeatureState) => state.tickers
);

export const selectLoading = createSelector(
  selectFeature,
  (state: FeatureState) => state.loading
);

export const selectError = createSelector(
  selectFeature,
  (state: FeatureState) => state.error
);

export const selectLastFetched = createSelector(
  selectFeature,
  (state: FeatureState) => state.lastFetched
);

// Heavy portfolio derivation. Memoized by NgRx: it recomputes only when the raw
// transactions or tickers change — NOT on every action or on loading/error
// toggles. This is the work that previously ran in the reducer on every action.
const selectPortfolio = createSelector(
  selectTransactionsDbo,
  selectTickers,
  (transactionsDbo, tickers) => computePortfolioState(transactionsDbo, tickers)
);

// Public view-model — the same shape components and the Yahoo effect consumed
// before A1 (transactions, stocks, dates, summary, currencies) plus loading/error.
export const selectState = createSelector(
  selectPortfolio,
  selectLoading,
  selectError,
  (portfolio, loading, error) => ({ ...portfolio, loading, error })
);
