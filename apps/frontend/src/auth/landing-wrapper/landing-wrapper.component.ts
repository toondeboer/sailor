import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LandingPageComponent } from '@aws/ui';
import { AuthService } from '../auth.service';

@Component({
  selector: 'aws-landing-wrapper',
  standalone: true,
  imports: [LandingPageComponent],
  template: '<aws-landing-page (login)="onLogin()"></aws-landing-page>',
})
export class LandingWrapperComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin(): void {
    this.router.navigate(['/signin']);
  }
}
