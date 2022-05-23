# SFrame.js

Pure javascript library implementing the SFrame end to end encryption based on webcrypto.

## Differences from sframe current draft

- keyIds are used as senderIds.
- IV contains the keyId and the frame counter to ensure uniquenes when using same encryption key for all participants.
- keysIds are limited to 5 bytes long to avoid javascirpt signed/unsigned issues.
- Option to skip the vp8 payload header and send it in clear.
- Ed25519 is not used for sign/verify as it is not available in webcrypto, ECDSA with P-512 is used instead.

## Keying

This library does not provide any keying mechanism, but it must be provide by the application instead.

Unlike the sframe draft, this library requires each participant to have a numeric `senderId` that will be used as `keyId` in the sframe  header.

## API

Check [api.md](/api.md)

## Setup

```sh
npm i
```

## Run the example app

Run the example code in example/e2ee.js
This command bundles the code and serves it using webpack-dev-server

```sh
npm run example
```

## Build

The command creates a webpack build of the lib and outputs it to the `dist_github` folder.
This file is committed to github so that we can install without npm.

```sh
npm run build
```

Note: webpack build is required so that we can inline the Worker file so that it doesn't have to be hosted separately.

## License

MIT
