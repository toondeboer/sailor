import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ProtectedComponent } from './protected.component';

describe('ProtectedComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectedComponent],
      providers: [
        provideRouter([]),
        { provide: OidcSecurityService, useValue: {} },
        { provide: 'ENVIRONMENT', useValue: { baseUrl: '' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProtectedComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
