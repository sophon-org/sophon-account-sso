export const u8ToString = (input: Uint8Array): string => {
  const str = JSON.stringify(
    Array.from ? Array.from(input) : [].map.call(input, (v) => v),
  );
  return str;
};

export const stringToU8 = (input: string): Uint8Array => {
  return new Uint8Array(JSON.parse(input));
};
