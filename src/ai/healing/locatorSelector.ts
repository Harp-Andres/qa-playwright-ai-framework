export type LocatorSelectorKind = 'role' | 'text' | 'testid' | 'id' | 'css';

export interface ParsedLocatorSelector {
  kind: LocatorSelectorKind;
  /** Raw selector tail (CSS, text, id value, test id, etc.). */
  value: string;
  /** Playwright role name when kind is `role`. */
  role?: string;
  /** Accessible name when kind is `role`. */
  roleName?: string;
}

export function parseLocatorSelector(selector: string): ParsedLocatorSelector {
  if (selector.startsWith('role=')) {
    const withoutPrefix = selector.slice('role='.length);
    const eqIdx = withoutPrefix.indexOf('=');
    const role = eqIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, eqIdx);
    const roleName = eqIdx === -1 ? undefined : withoutPrefix.slice(eqIdx + 1);
    return { kind: 'role', value: withoutPrefix, role, roleName };
  }

  if (selector.startsWith('text=')) {
    return { kind: 'text', value: selector.slice('text='.length) };
  }

  if (selector.startsWith('testid=')) {
    return { kind: 'testid', value: selector.slice('testid='.length) };
  }

  if (selector.startsWith('id=')) {
    return { kind: 'id', value: selector.slice('id='.length) };
  }

  return { kind: 'css', value: selector };
}
