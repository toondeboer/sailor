import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        provideRouter([]),
        { provide: OidcSecurityService, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CallbackComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
