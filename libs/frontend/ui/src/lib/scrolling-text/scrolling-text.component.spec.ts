import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ScrollingTextComponent } from './scrolling-text.component';

describe('ScrollingTextComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollingTextComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScrollingTextComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
