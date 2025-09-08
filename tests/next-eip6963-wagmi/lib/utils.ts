export const safeStringify = (obj: unknown) => {
  return JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v,
  );
};
