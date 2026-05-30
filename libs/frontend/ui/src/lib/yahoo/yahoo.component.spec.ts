import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { YahooComponent } from './yahoo.component';

describe('YahooComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [YahooComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    const fixture = TestBed.createComponent(YahooComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
