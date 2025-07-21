import { describe, expect, it } from 'vitest';
import { isSSR } from '../is-ssr';

describe('isSSR', () => {
  it('should return false when window is not defined', () => {
    // when
    const result = isSSR();

    // then
    expect(result).toBe(false);
  });
});
