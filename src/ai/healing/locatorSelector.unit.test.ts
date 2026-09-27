import { describe, expect, it } from 'vitest';
import { parseLocatorSelector } from './locatorSelector';

describe('parseLocatorSelector', () => {
  it('parses role selectors with accessible name', () => {
    expect(parseLocatorSelector('role=button=Login')).toEqual({
      kind: 'role',
      value: 'button=Login',
      role: 'button',
      roleName: 'Login',
    });
  });

  it('parses text and test id prefixes', () => {
    expect(parseLocatorSelector('text=Submit').kind).toBe('text');
    expect(parseLocatorSelector('testid=checkout').value).toBe('checkout');
  });

  it('treats unknown strings as CSS', () => {
    expect(parseLocatorSelector('#login-btn')).toEqual({
      kind: 'css',
      value: '#login-btn',
    });
  });
});
