import { useState } from 'react';

export function multiply(a: number, b: number): number {
  return a * b;
}

export const useMultiply = (a: number, b: number) => {
  const [num, setNum] = useState(a * b);
  return {
    num,
    setNum,
  };
};
