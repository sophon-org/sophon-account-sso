# @sophon-labs/account-api-sdk

This is just a helper library for interacting with Sophon Account API.

## Installation

```bash
npm install @sophon-labs/account-api-sdk
# or
yarn add @sophon-labs/account-api-sdk
```

## Usage

First, you need to initialize the SDK with your `partnerId` and which network is your goal, `mainnet` or `testnet`. For example:

```ts
const network = "testnet";
const partnerId = "123b216c-678e-4611-af9a-2d5b7b061258"; // if you don't have a partnerId, get in touch with us
const sdk = SophonAPISDK(network, partnerId);

const result = await sdk.jwt.getUser(token);
// ...
```

## Modules

## Auth

Module specialised on calling Auth related endpoints.

- `async decodeJWT(token: string) => Promise<AuthDecodedJWT>`: helper function that gets Sophon's public key and decodes the JWT token for basic information.
- `publicKeyUrl() => string`: returns the public key url
- `async getUser(token: string)`: fetches user public information with specific shared fields
