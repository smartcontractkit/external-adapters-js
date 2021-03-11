# Chainlink Outlier Detection composite adapter

The outlier detection composite adapter will determine if a median value from a set of source data providers is an
outlier value compared to either the median value from a set of data providers, or the current on-chain value. If the
deviation between these values is greater than the thresholds defined, the adapter returns the current on-chain value.
If all checks passes, the adapter returns the median from the source data providers.

## Configuration

The adapter takes the following environment variables:

- `SOURCE_ADAPTERS`: Required list of data source adapters. One or multiple of: `xbto|genesisvolatility|dxfeed`
- `CHECK_ADAPTERS`: List of adapters to check against. One or multiple of: `deribit|oilpriceapi|dxfeed`
- `CHECK_THRESHOLD`: Set a percentage deviation threshold against the check data sources. Set to 0 or empty to not
perform this check.
- `ONCHAIN_THRESHOLD`: Set a percentage deviation threshold against the on-chain value. Set to 0 or empty to not
perform this check.
- `RPC_URL`: ETH RPC URL to read the reference data value. Required by runlog requests.

This adapter also takes any configuration variables of the underlying adapters. Simply prefix the environment variables.
E.g. dxFeed endpoint URL:

- `DXFEED_API_ENDPOINT=http://example.com`

### Adapter list grammar

```ebnf
# E.g.: SOURCE_ADAPTERS=xbto,dxfeed
<SOURCE_ADAPTERS> ::= <source> ( "," <source> )*
<source> ::= "xbto" | "genesisvolatility" | "dxfeed"

# E.g.: CHECK_ADAPTERS=oilpriceapi,dxfeed
<CHECK_ADAPTERS> ::= <check> ( "," <check> )*
<check> ::= "deribit" | "oilpriceapi" | "dxfeed"
```

## Run

First build the project:

```bash
yarn build
```

Then run the adapter.

Examples of combinations include:

### WTI Outlier detection

- **Sources:** XBTO
- **Checks:** OilpriceAPI
- **Check threshold:** 10

```bash
env \
  SOURCE_ADAPTERS=xbto \
  CHECK_ADAPTERS=oilpriceapi \
  XBTO_API_KEY=your-xbto-api-key \
  OILPRICEAPI_API_KEY=your-oilpriceapi-api-key \
  RPC_URL=your-https-rpc-url \
  CHECK_THRESHOLD=10 \
  yarn start
```

### IV Outlier detection

- **Sources:** GenesisVolatility
- **Checks:** Deribit
- **Check threshold:** 30
- **Onchain threshold:** 50

```bash
env \
  SOURCE_ADAPTERS=genesisvolatility \
  CHECK_ADAPTERS=deribit \
  GENESISVOLATILITY_API_KEY=your-genesisvolatility-api-key \
  RPC_URL=your-https-rpc-url \
  CHECK_THRESHOLD=30 \
  ONCHAIN_THRESHOLD=50 \
  yarn start
```
