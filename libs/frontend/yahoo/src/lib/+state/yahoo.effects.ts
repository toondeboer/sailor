import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, catchError, of, withLatestFrom, mergeMap } from 'rxjs';
import { YahooService } from '../yahoo.service';
import { getTickerFailure, getTickersSuccess } from './yahoo.actions';
import { yahooObjectsToTickers } from '@aws/util';
import { getDataSuccess, selectState, setChartData } from '@aws/state';

@Injectable()
export class YahooEffects {
  constructor(
    private store: Store,
    private readonly actions$: Actions,
    private readonly service: YahooService
  ) {}

  // On a fresh data load, fetch the latest prices for the held tickers and feed
  // them into the store. Save/delete/import don't refetch prices — the memoized
  // portfolio selector recomputes from the changed transactions using the
  // tickers already in the store.
  public readonly getTicker$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getDataSuccess),
      withLatestFrom(this.store.select(selectState)),
      switchMap(([_, { stocks, summary, currencies }]) => {
        return this.service
          .getTickers(Object.keys(stocks), summary.startDate, currencies)
          .pipe(
            mergeMap((yahooObjects) => {
              const tickers = yahooObjectsToTickers(yahooObjects);
              return [getTickersSuccess({ tickers }), setChartData({ tickers })];
            }),
            catchError((error: HttpErrorResponse) =>
              of(getTickerFailure({ error: error.message }))
            )
          );
      })
    )
  );
}
