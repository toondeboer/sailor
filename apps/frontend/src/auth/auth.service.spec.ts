import { nicknameFromEmail } from './auth.service';

describe('nicknameFromEmail', () => {
  it('uses the local part of the email', () => {
    expect(nicknameFromEmail('jane.doe@example.com')).toBe('jane.doe');
  });

  it('trims surrounding whitespace', () => {
    expect(nicknameFromEmail('  jane@example.com ')).toBe('jane');
  });

  it('falls back to the full value when there is no local part', () => {
    expect(nicknameFromEmail('@example.com')).toBe('@example.com');
  });
});
