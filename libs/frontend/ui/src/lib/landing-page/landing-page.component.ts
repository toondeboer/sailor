import {
  Component,
  OnInit,
  HostListener,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

@Component({
  selector: 'aws-landing-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  @Output() login = new EventEmitter();

  title = 'portfolio-tracker';
  isScrolled = false;
  mobileMenuOpen = false;
  chartLoaded = false;
  portfolioReturn = 12.5;
  portfolioValue = 24856;
  currentYear = new Date().getFullYear();

  features: Feature[] = [
    {
      icon: '⚓',
      title: 'Secure Harbour',
      description:
        'Enterprise-grade security keeps your portfolio data encrypted and protected at all times — a safe harbour for your investments.',
    },
    {
      icon: '🧭',
      title: 'AI-Powered Insights',
      description:
        'Intelligent analytics chart your course. Beautiful visualisations and trend detection help you navigate markets with confidence.',
    },
    {
      icon: '🌊',
      title: 'DeGiro Integration',
      description:
        'Seamlessly import CSV exports from DeGiro. Our smart parser automatically organises your trading history — no manual entry.',
    },
    {
      icon: '⚡',
      title: 'Real-Time Data',
      description:
        'Live market data powered by Yahoo Finance. Stay current with real-time prices and portfolio valuation as markets move.',
    },
  ];

  steps: Step[] = [
    {
      number: 1,
      title: 'Set Sail',
      description:
        'Create your account in under 30 seconds. sAIlor handles the authentication so you can focus on your investments.',
    },
    {
      number: 2,
      title: 'Chart Your Course',
      description:
        "Export your CSV from DeGiro and upload it. Our AI engine automatically charts your complete trading history.",
    },
    {
      number: 3,
      title: 'Navigate to Growth',
      description:
        'Watch your portfolio come alive with real-time analytics, performance charts, and intelligent insights.',
    },
  ];

  ngOnInit() {
    // Simulate chart loading
    setTimeout(() => {
      this.chartLoaded = true;
    }, 2000);

    // Animate portfolio values
    this.animateValue('portfolioReturn', 0, 12.5, 2000);
    this.animateValue('portfolioValue', 20000, 24856, 2500);
  }

  onClick() {
    this.login.emit();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;

    // Prevent body scroll when menu is open
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768 && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 100;
  }

  scrollTo(elementId: string, event: Event) {
    event.preventDefault();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  trackByFeature(index: number, feature: Feature): string {
    return feature.title;
  }

  trackByStep(index: number, step: Step): number {
    return step.number;
  }

  // Make sure to close mobile menu on component destroy
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private animateValue(
    property: string,
    start: number,
    end: number,
    duration: number
  ) {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = start + (end - start) * this.easeOutCubic(progress);

      (this as any)[property] =
        property === 'portfolioReturn'
          ? Math.round(currentValue * 10) / 10
          : Math.round(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
