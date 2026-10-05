import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth.service';
import { SignUpComponent } from './signup.component';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let signUp: jest.Mock;

  beforeEach(async () => {
    signUp = jest.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { signUp } },
      ],
    }).compileComponents();
    component = TestBed.createComponent(SignUpComponent).componentInstance;
    component.email = 'jane@example.com';
    component.password = 'Secret123!';
    component.confirmPassword = 'Secret123!';
  });

  it('passes the trimmed nickname to sign-up', async () => {
    component.nickname = '  Jane  ';
    await component.register();
    expect(signUp).toHaveBeenCalledWith(
      'jane@example.com',
      'Secret123!',
      'Jane',
    );
    expect(component.step).toBe('confirm');
  });

  it('rejects a blank nickname without calling sign-up', async () => {
    component.nickname = '   ';
    await component.register();
    expect(signUp).not.toHaveBeenCalled();
    expect(component.error).toBe('Please enter a nickname.');
    expect(component.step).toBe('register');
  });
});
