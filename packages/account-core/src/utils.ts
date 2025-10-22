/**
 * Check if the code is running on the server
 *
 * @returns True if the code is running on the server, false otherwise
 */
export const isSSR = () => {
  return typeof window === 'undefined';
};

/**
 * Check if the browser has localStorage. In some cases we have window available but no localStorage.
 *
 * @returns True if the browser has localStorage, false otherwise
 */
export const hasLocalStorage = () => {
  return typeof localStorage !== 'undefined';
};
