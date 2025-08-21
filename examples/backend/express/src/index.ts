import { SophonAPISDK } from '@sophon-labs/account-api-sdk';
import express, { type Request, type Response } from 'express';

const app = express();
const port = 3005;
const jwt =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImF1dGgta2V5LTEifQ.eyJzdWIiOiIweDNkODMzOTQyNWIzNmJhMDIyNzZlZGJlODIwZDY5M2U4ZWI3MGE4ZjUiLCJpYXQiOjE3NTU1MTg2ODMsInNjb3BlIjoiZW1haWwiLCJ1c2VySWQiOiIyM2JiYzI2NS1kYTkxLTQyMTYtYWRjNi1hY2I0OTQwYWI4ZjMiLCJleHAiOjE3NTYxMjM0ODMsImF1ZCI6IjEyM2IyMTZjLTY3OGUtNDYxMS1hZjlhLTJkNWI3YjA2MTI1OCIsImlzcyI6Imh0dHBzOi8vYXV0aC5zb3Bob24ueHl6In0.pLi7Cit5cYSxhd9kcs7wrQxVaYCzx4xUTlShznXggj26LtAin4qmVwLklIB-GVq16cOXpWFNNoYq97nyuRbVg4GRKpODMK513xht4RCnG-swhuaSpwAPokfwnbKLWNEKSsaY0lF_hGL_BxW3bKVskfCBvWprX-sP6es30wXyq7kzODoYTgNZpr6Tp0h-WuqxMqqwFZiRUK64vhkz2r9t9F_vFiJmYdWRDgE_DDiJlL29U4_OTegUt81Ap3Xg7sz7kRjRRdoSuJTmG4d-8F7n8qQs9NwBbjriYiK14HT_9mbvYftr21pGdlPgoQalm1HnFD-Pm9h6ppIDAmcHFj8UYw';
const sdk = SophonAPISDK('testnet', '123b216c-678e-4611-af9a-2d5b7b061258');

app.get('/decode', async (_: Request, res: Response) => {
  console.log('GET /');
  const token = await sdk.auth.decodeJWT(jwt);
  res.json(token);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
