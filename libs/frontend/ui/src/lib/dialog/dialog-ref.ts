import { InjectionToken } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export class DialogRef<T = unknown, R = unknown> {
  private readonly _afterClosed = new Subject<R | undefined>();

  afterClosed(): Observable<R | undefined> {
    return this._afterClosed.asObservable();
  }

  close(result?: R): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}

export const DIALOG_REF = new InjectionToken<DialogRef>('DIALOG_REF');
export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');
