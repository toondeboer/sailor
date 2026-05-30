import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { DatabaseDto, parseDatabaseDto, Transactions } from '@aws/util';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  constructor(
    @Inject('ENVIRONMENT') private environment: any,
    private http: HttpClient
  ) {}

  public getData(): Observable<DatabaseDto> {
    console.log('AWS LAMBDA CALL - Database - get data');
    return this.http
      .get<unknown>(`${this.environment.dynamoDBLambdaUrl}`)
      .pipe(map((response) => parseDatabaseDto(response)));
  }

  public setTransactions(transactions: Transactions): Observable<DatabaseDto> {
    console.log('AWS LAMBDA CALL - Database - set data');
    console.log(transactions);
    return this.http
      .put<unknown>(`${this.environment.dynamoDBLambdaUrl}`, { transactions })
      .pipe(map((response) => parseDatabaseDto(response)));
  }
}
