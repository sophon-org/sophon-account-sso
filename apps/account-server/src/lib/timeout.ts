export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          errorMessage ??
            `Operation timed out, please check your network and try again.`,
        ),
      );
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
