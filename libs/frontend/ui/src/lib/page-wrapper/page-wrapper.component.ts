import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Router, RouterOutlet } from '@angular/router';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { Store } from '@ngrx/store';
import { getData, selectLoading } from '@aws/state';
import { ScrollingTextComponent } from '../scrolling-text/scrolling-text.component';
import { MatToolbar } from '@angular/material/toolbar';
import { MatListItem, MatNavList } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'aws-page-wrapper',
  templateUrl: './page-wrapper.component.html',
  styleUrls: ['./page-wrapper.component.scss'],
  imports: [
    RouterOutlet,
    MatSidenavContent,
    MatSidenavContainer,
    ScrollingTextComponent,
    MatToolbar,
    MatSidenav,
    MatNavList,
    CommonModule,
    MatButton,
    MatIconButton,
    MatListItem,
    MatProgressBar,
    MatIcon,
  ],
})
export class PageWrapperComponent implements OnInit, OnDestroy {
  loading$ = this.store.select(selectLoading);
  mobileQuery: MediaQueryList;
  navigationOptions = [
    { path: 'dashboard',  text: 'Dashboard',  icon: 'dashboard' },
    { path: 'portfolios', text: 'Portfolios', icon: 'folder' },
    { path: 'settings',   text: 'Settings',   icon: 'settings' },
  ];

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private readonly router: Router,
    private store: Store,
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.store.dispatch(getData());
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  isActive(path: string): boolean {
    return this.router.url === '/' + path || this.router.url.startsWith('/' + path + '/');
  }

  routeTo(route: string, snav: MatSidenav) {
    snav.close();
    this.router.navigate([route]);
  }

  logout(): void {
    window.sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
