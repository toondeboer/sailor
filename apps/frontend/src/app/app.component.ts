import { Component } from '@angular/core';

@Component({
  selector: 'aws-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // The root component is bootstrapped via AppModule (an NgModule), so it must
  // stay non-standalone — bootstrapping a standalone component from an NgModule
  // breaks the dev server's JIT path (@angular/compiler gets tree-shaken).
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class AppComponent {
  title = 'frontend';
}
