import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { PageWrapperComponent } from './page-wrapper.component';

describe('PageWrapperComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [PageWrapperComponent],
      providers: [
        provideMockStore(),
        provideRouter([]),
        { provide: 'ENVIRONMENT', useValue: { baseUrl: '' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PageWrapperComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
