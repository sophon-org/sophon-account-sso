/**
 * Helper function to check if the code is running on the server.
 *
 * @returns True if the code is running on the server, false otherwise.
 */
export const isSSR = () => typeof window === 'undefined';
