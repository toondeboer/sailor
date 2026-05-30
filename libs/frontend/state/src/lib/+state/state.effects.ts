import { StateService } from './../state.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, catchError, of, map, tap, withLatestFrom } from 'rxjs';
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
} from './state.actions';
import { selectLastFetched } from './state.selectors';
import { Transactions, parseCsvInput, translateToDutch } from '@aws/util';

// How long a successful transactions fetch stays "fresh"; within this window a
// repeat getData (e.g. navigating back to a route that loads data) is served
// from the store instead of re-hitting DynamoDB.
const GET_DATA_CACHE_MS = 30_000;

@Injectable()
export class StateEffects {
  constructor(
    private store: Store,
    private readonly actions$: Actions,
    private readonly service: StateService,
    private readonly snackBar: MatSnackBar
  ) {}

  // Surface any failure to the user as a dismissible toast. Without this, the
  // *Failure actions are dispatched but never shown — a save could fail silently.
  public readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          getDataFailure,
          saveTransactionFailure,
          deleteTransactionFailure,
          deleteAllTransactionsFailure,
          handleFileInputFailure
        ),
        tap(({ error }) =>
          this.snackBar.open(error || 'Something went wrong', 'Dismiss', {
            duration: 6000,
            panelClass: 'error-snackbar',
          })
        )
      ),
    { dispatch: false }
  );

  public readonly getData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getData),
      withLatestFrom(this.store.select(selectLastFetched)),
      switchMap(([, lastFetched]) => {
        // Serve from cache while still fresh (avoids re-fetching on every
        // route visit that triggers getData).
        if (
          lastFetched !== null &&
          Date.now() - lastFetched < GET_DATA_CACHE_MS
        ) {
          return of(getDataCached());
        }
        return this.service.getData().pipe(
          map(({ transactions }) => getDataSuccess({ data: transactions })),
          catchError((error: HttpErrorResponse) =>
            of(getDataFailure({ error: error.message }))
          )
        );
      })
    )
  );

  public readonly saveTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveTransaction),
      switchMap(({ transactions }) => {
        return this.service.setTransactions(transactions).pipe(
          map(({ transactions }) => {
            return saveTransactionSuccess({
              transactions,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(saveTransactionFailure({ error: error.message }))
          )
        );
      })
    )
  );

  public readonly deleteTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTransaction),
      switchMap(({ newTransactions }) => {
        return this.service.setTransactions(newTransactions).pipe(
          map(({ transactions }) => {
            return deleteTransactionSuccess({
              transactions,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(deleteTransactionFailure({ error: error.message }))
          )
        );
      })
    )
  );

  public readonly deleteAllTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteAllTransactions),
      switchMap(() => {
        return this.service
          .setTransactions({ stock: [], commission: [], dividend: [] })
          .pipe(
            map(({ transactions }) => {
              return deleteAllTransactionsSuccess({
                transactions,
              });
            }),
            catchError((error: HttpErrorResponse) =>
              of(deleteAllTransactionsFailure({ error: error.message }))
            )
          );
      })
    )
  );

  public readonly handleFileInput$ = createEffect(() =>
    this.actions$.pipe(
      ofType(handleFileInput),
      switchMap(({ data }) => {
        let newTransactions: Transactions;
        try {
          newTransactions = parseCsvInput(translateToDutch(data));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to parse CSV file';
          return of(handleFileInputFailure({ error: message }));
        }

        return this.service.setTransactions(newTransactions).pipe(
          map(({ transactions }) => {
            return handleFileInputSuccess({
              transactions,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(handleFileInputFailure({ error: error.message }))
          )
        );
      })
    )
  );
}
