import cookies from 'js-cookie';

export const SOPHON_AUTH_COOKIE_NAME = 'SOPHON_JWT_TOKEN';

export const getCookieAuthToken = () => {
  return cookies.get(SOPHON_AUTH_COOKIE_NAME);
};

export const setCookieAuthToken = (value: string) => {
  return cookies.set(SOPHON_AUTH_COOKIE_NAME, value);
};
