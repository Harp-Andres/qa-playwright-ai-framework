import type { FailureCategory } from './failureCategory';

export interface FailureClassificationStrategy {
  readonly category: FailureCategory;
  matches(message: string): boolean;
}

export class LocatorFailureStrategy implements FailureClassificationStrategy {
  readonly category = 'locator' as const;

  matches(message: string): boolean {
    return message.includes('self-healing locator') || message.includes('locator');
  }
}

export class TimeoutFailureStrategy implements FailureClassificationStrategy {
  readonly category = 'timeout' as const;

  matches(message: string): boolean {
    return message.includes('timeout');
  }
}

export class NetworkFailureStrategy implements FailureClassificationStrategy {
  readonly category = 'network' as const;

  matches(message: string): boolean {
    const markers = [
      'network',
      'net::err',
      'err_name_not_resolved',
      'econnrefused',
      'econnreset',
      'etimedout',
    ];
    return markers.some((marker) => message.includes(marker));
  }
}

export class AssertionFailureStrategy implements FailureClassificationStrategy {
  readonly category = 'assertion' as const;

  matches(message: string): boolean {
    return message.includes('expect');
  }
}

export const defaultFailureStrategies: readonly FailureClassificationStrategy[] = [
  new LocatorFailureStrategy(),
  new TimeoutFailureStrategy(),
  new NetworkFailureStrategy(),
  new AssertionFailureStrategy(),
];
