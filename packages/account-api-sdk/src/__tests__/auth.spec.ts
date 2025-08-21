import { describe, expect, it } from 'vitest';
import { SophonAPISDK } from '..';

describe('Auth API SDK', () => {
  it('should be able to decode a JWT with scopes', async () => {
    // given
    const network = 'testnet';
    const partnerId = '123b216c-678e-4611-af9a-2d5b7b061258';
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgta2V5LTEifQ.eyJzdWIiOiIweDNkODMzOTQyNWIzNmJhMDIyNzZlZGJlODIwZDY5M2U4ZWI3MGE4ZjUiLCJpYXQiOjE3NTU1MTg2ODMsInNjb3BlIjoiZW1haWwiLCJ1c2VySWQiOiIyM2JiYzI2NS1kYTkxLTQyMTYtYWRjNi1hY2I0OTQwYWI4ZjMiLCJleHAiOjE3NTYxMjM0ODMsImF1ZCI6IjEyM2IyMTZjLTY3OGUtNDYxMS1hZjlhLTJkNWI3YjA2MTI1OCIsImlzcyI6Imh0dHBzOi8vYXV0aC5zb3Bob24ueHl6In0.pLi7Cit5cYSxhd9kcs7wrQxVaYCzx4xUTlShznXggj26LtAin4qmVwLklIB-GVq16cOXpWFNNoYq97nyuRbVg4GRKpODMK513xht4RCnG-swhuaSpwAPokfwnbKLWNEKSsaY0lF_hGL_BxW3bKVskfCBvWprX-sP6es30wXyq7kzODoYTgNZpr6Tp0h-WuqxMqqwFZiRUK64vhkz2r9t9F_vFiJmYdWRDgE_DDiJlL29U4_OTegUt81Ap3Xg7sz7kRjRRdoSuJTmG4d-8F7n8qQs9NwBbjriYiK14HT_9mbvYftr21pGdlPgoQalm1HnFD-Pm9h6ppIDAmcHFj8UYw';
    const sdk = SophonAPISDK(network, partnerId);

    // when
    const result = await sdk.auth.decodeJWT(token);

    // then
    expect(result).toEqual({
      aud: '123b216c-678e-4611-af9a-2d5b7b061258',
      exp: 1756123483,
      iat: 1755518683,
      iss: 'https://auth.sophon.xyz',
      scope: 'email',
      sub: '0x3d8339425b36ba02276edbe820d693e8eb70a8f5',
      userId: '23bbc265-da91-4216-adc6-acb4940ab8f3',
    });
  });

  it('should be able to decode a JWT without scopes', async () => {
    // given
    const network = 'testnet';
    const partnerId = '123b216c-678e-4611-af9a-2d5b7b061258';
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgta2V5LTEifQ.eyJzdWIiOiIweDNkODMzOTQyNWIzNmJhMDIyNzZlZGJlODIwZDY5M2U4ZWI3MGE4ZjUiLCJpYXQiOjE3NTU1MjA5MTEsInNjb3BlIjoiIiwidXNlcklkIjoiMjNiYmMyNjUtZGE5MS00MjE2LWFkYzYtYWNiNDk0MGFiOGYzIiwiZXhwIjoxNzU2MTI1NzExLCJhdWQiOiIxMjNiMjE2Yy02NzhlLTQ2MTEtYWY5YS0yZDViN2IwNjEyNTgiLCJpc3MiOiJodHRwczovL2F1dGguc29waG9uLnh5eiJ9.LwRjHSCGyo341ohW5RSOFAA1ySTOwrBOYCwfSR5EJZaZvwBMrxNP_POf0w4yOSncQ_BID_4YCbQnhDdFbKTHu8lC_aDNVxpQY19EkexNFDm3L1zZrqxdZVpOz-ebemOZJXMKa727NTZdyT_6ZFa2No4U_vi5DPZ5sTLVcZngDX_LJtvg_pLS3CyzocedfW2LFof1g7HT9CJtYg4pXD7z2SlzSMKmWxO5z9r4jQS6MlGhcVumE9zq8gwCv_aR5fHqHcjfJWZVFyQyc7YTzVKKI7O7U2LBIjZz_M2Mrlg6gpdwZRNlpW9EESTWkZlhRZgIJnxVHDd7aTQ9S-0SRW__Iw';
    const sdk = SophonAPISDK(network, partnerId);

    // when
    const result = await sdk.auth.decodeJWT(token);

    // then
    expect(result).toEqual({
      aud: '123b216c-678e-4611-af9a-2d5b7b061258',
      exp: 1756125711,
      iat: 1755520911,
      iss: 'https://auth.sophon.xyz',
      scope: '',
      sub: '0x3d8339425b36ba02276edbe820d693e8eb70a8f5',
      userId: '23bbc265-da91-4216-adc6-acb4940ab8f3',
    });
  });

  it('should be able to get user data', async () => {
    // given
    const network = 'testnet';
    const partnerId = '123b216c-678e-4611-af9a-2d5b7b061258';
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgta2V5LTEifQ.eyJzdWIiOiIweDNkODMzOTQyNWIzNmJhMDIyNzZlZGJlODIwZDY5M2U4ZWI3MGE4ZjUiLCJpYXQiOjE3NTU1MTg2ODMsInNjb3BlIjoiZW1haWwiLCJ1c2VySWQiOiIyM2JiYzI2NS1kYTkxLTQyMTYtYWRjNi1hY2I0OTQwYWI4ZjMiLCJleHAiOjE3NTYxMjM0ODMsImF1ZCI6IjEyM2IyMTZjLTY3OGUtNDYxMS1hZjlhLTJkNWI3YjA2MTI1OCIsImlzcyI6Imh0dHBzOi8vYXV0aC5zb3Bob24ueHl6In0.pLi7Cit5cYSxhd9kcs7wrQxVaYCzx4xUTlShznXggj26LtAin4qmVwLklIB-GVq16cOXpWFNNoYq97nyuRbVg4GRKpODMK513xht4RCnG-swhuaSpwAPokfwnbKLWNEKSsaY0lF_hGL_BxW3bKVskfCBvWprX-sP6es30wXyq7kzODoYTgNZpr6Tp0h-WuqxMqqwFZiRUK64vhkz2r9t9F_vFiJmYdWRDgE_DDiJlL29U4_OTegUt81Ap3Xg7sz7kRjRRdoSuJTmG4d-8F7n8qQs9NwBbjriYiK14HT_9mbvYftr21pGdlPgoQalm1HnFD-Pm9h6ppIDAmcHFj8UYw';
    const sdk = SophonAPISDK(network, partnerId);

    // when
    const result = await sdk.auth.getUser(token);

    // then
    expect(result).toEqual({
      aud: '123b216c-678e-4611-af9a-2d5b7b061258',
      iss: 'https://auth.sophon.xyz',
      scope: ['email'],
      exp: 1756123483,
      iat: 1755518683,
      sub: '0x3d8339425b36ba02276edbe820d693e8eb70a8f5',
      fields: {
        email: 'me@israelcrisanto.com',
      },
    });
  });
});
