## Hardcoded Feeds

Outside of overrides defined in the standard [overrides.json](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/config/overrides.json) file, the Finage EA has some custom hardcoded logic.

### Forex Endpoint - Transport Routing & Assets

The `forex` endpoint includes custom logic for routing [certain assets](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/forex.ts#L44) to REST.

Additionally, many forex assets quoted in USD are inversed. [This](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/forex.ts#L19) is a map of assets excluded from this inverse logic; all other /USD pairs should be considered as inverse pairs.

### Crypto Endpoint - Asset Transport routing

Similarly, for the `crypto` endpoint, [these asset pairs](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/crypto.ts#L9-L18) are routed to REST only.
