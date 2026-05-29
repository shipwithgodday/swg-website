import { maskEmail } from './maskEmail';

describe('maskEmail', () => {
  it('masks the local part leaving first 2 chars', () => {
    expect(maskEmail('obeng.darkogh@gmail.com')).toBe('ob***@gmail.com');
  });

  it('works with a short local part (1 char)', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
  });

  it('works with a 2-char local part', () => {
    expect(maskEmail('jo@example.com')).toBe('jo***@example.com');
  });

  it('returns the input unchanged when there is no @', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });
});
