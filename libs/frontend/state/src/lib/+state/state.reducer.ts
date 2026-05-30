import { createFeature, createReducer, on } from '@ngrx/store';
import {
  deleteAllTransactions,
  deleteAllTransactionsFailure,
  deleteAllTransactionsSuccess,
  deleteTransaction,
  deleteTransactionFailure,
  deleteTransactionSuccess,
  getData,
  getDataCached,
  getDataFailure,
  getDataSuccess,
  handleFileInput,
  handleFileInputFailure,
  handleFileInputSuccess,
  saveTransaction,
  saveTransactionFailure,
  saveTransactionSuccess,
  setChartData,
} from './state.actions';
import { Ticker, TransactionsDbo } from '@aws/util';

export const featureKey = 'state';

// The reducer stores only RAW inputs: the transactions loaded from the backend
// and the Yahoo price tickers. Every derived value (stocks, dates, summary,
// chart data) is computed on demand in memoized selectors — see
// state.selectors.ts. This keeps the reducer pure and cheap, and means the
// expensive portfolio math runs only when its inputs actually change.
export interface FeatureState {
  transactionsDbo: TransactionsDbo;
  tickers: { [ticker: string]: Ticker };
  loading: boolean;
  error: string | null;
  // Epoch ms of the last successful transactions fetch; drives the getData cache.
  lastFetched: number | null;
}

export const initialState: FeatureState = {
  transactionsDbo: { stock: [], dividend: [], commission: [] },
  tickers: {},
  loading: false,
  error: null,
  lastFetched: null,
};

export const reducer = createReducer(
  initialState,
  on(getDataSuccess, (state, { data }) => ({
    ...state,
    transactionsDbo: data,
  })),
  on(
    saveTransactionSuccess,
    deleteTransactionSuccess,
    deleteAllTransactionsSuccess,
    handleFileInputSuccess,
    (state, { transactions }) => ({ ...state, transactionsDbo: transactions })
  ),
  on(setChartData, (state, { tickers }) => ({ ...state, tickers })),
  // --- request / success / failure status tracking ---
  on(
    getData,
    saveTransaction,
    deleteTransaction,
    deleteAllTransactions,
    handleFileInput,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    getDataSuccess,
    saveTransactionSuccess,
    deleteTransactionSuccess,
    deleteAllTransactionsSuccess,
    handleFileInputSuccess,
    (state) => ({ ...state, loading: false, lastFetched: Date.now() })
  ),
  // Cache hit: clear loading without touching data (and without re-triggering
  // the Yahoo fetch, which keys off getDataSuccess).
  on(getDataCached, (state) => ({ ...state, loading: false })),
  on(
    getDataFailure,
    saveTransactionFailure,
    deleteTransactionFailure,
    deleteAllTransactionsFailure,
    handleFileInputFailure,
    (state, { error }) => ({ ...state, loading: false, error })
  )
);

export const feature = createFeature({ name: featureKey, reducer });
