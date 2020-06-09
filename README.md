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
 
 This allows to have the same encryption key across all the participants (instead of a per-participant key) while ensuring that the `IV` is used only once per key. Note that using a key per participant is strongly recommended.
 
 ## API
 
 Check [api.md](/api.md)
 
 ## Example
 
 Check the `example` directory for a loopback example implementation.
 
 ## License
 
 MIT
