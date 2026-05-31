import { createFeatureSelector, createSelector } from '@ngrx/store';
import { computeAllPortfolios, computePortfolioState, mergeTransactionsDbo } from '@aws/util';
import { FeatureState, featureKey } from './state.reducer';

export const selectFeature = createFeatureSelector<FeatureState>(featureKey);

export const selectPortfoliosDbo = createSelector(
  selectFeature,
  (state) => state.portfoliosDbo
);

export const selectSettings = createSelector(
  selectFeature,
  (state) => state.settings
);

export const selectBaseCurrency = createSelector(
  selectSettings,
  (settings) => settings.baseCurrency
);

const selectTickers = createSelector(
  selectFeature,
  (state) => state.tickers
);

export const selectLoading = createSelector(
  selectFeature,
  (state) => state.loading
);

export const selectError = createSelector(
  selectFeature,
  (state) => state.error
);

export const selectLastFetched = createSelector(
  selectFeature,
  (state) => state.lastFetched
);

export const selectSelectedPortfolioIds = createSelector(
  selectFeature,
  (state) => state.selectedPortfolioIds
);

// The portfolios that are currently visible on the dashboard.
export const selectVisiblePortfoliosDbo = createSelector(
  selectPortfoliosDbo,
  selectSelectedPortfolioIds,
  (portfolios, ids) =>
    ids === 'all' ? portfolios : portfolios.filter((p) => ids.includes(p.id))
);

// Aggregate portfolio state — merges all visible portfolios' transactions and
// runs computePortfolioState over them. This is the view-model used by the
// dashboard and as the backward-compat selectState.
const selectAggregatePortfolio = createSelector(
  selectVisiblePortfoliosDbo,
  selectTickers,
  (portfolios, tickers) => {
    const merged = mergeTransactionsDbo(portfolios.map((p) => p.transactions));
    return computePortfolioState(merged, tickers);
  }
);

// Per-portfolio computed states keyed by portfolio ID.
export const selectAllPortfolioStates = createSelector(
  selectPortfoliosDbo,
  selectTickers,
  (portfolios, tickers) => computeAllPortfolios(portfolios, tickers)
);

// Public view-model — same shape as before (transactions, stocks, dates, summary,
// currencies) plus loading/error. Backward compat for existing components.
export const selectState = createSelector(
  selectAggregatePortfolio,
  selectLoading,
  selectError,
  (portfolio, loading, error) => ({ ...portfolio, loading, error })
);
