# APY_FINANCE_TEST

![0.2.15](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/apy-finance-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name            |                        Description                        |  Type  | Options |                   Default                    |
| :-------: | :-----------------------: | :-------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|           |   COINGECKO_ADAPTER_URL   |       The location of a CoinGecko external adapter        | string |         |                                              |
|           | COINMARKETCAP_ADAPTER_URL |     The location of a CoinMarketCap external adapter      | string |         |                                              |
|           |  COINMETRICS_ADAPTER_URL  |      The location of a CoinMetrics external adapter       | string |         |                                              |
|           |  COINPAPRIKA_ADAPTER_URL  |      The location of a CoinPaprika external adapter       | string |         |                                              |
|           |  COINRANKING_ADAPTER_URL  |      The location of a CoinRanking external adapter       | string |         |                                              |
|           | CRYPTOCOMPARE_ADAPTER_URL |     The location of a CryptoCompare external adapter      | string |         |                                              |
|           |     KAIKO_ADAPTER_URL     |         The location of a Kaiko external adapter          | string |         |                                              |
|           |    TIINGO_ADAPTER_URL     |         The location of a Tiingo external adapter         | string |         |                                              |
|           |   AMBERDATA_ADAPTER_URL   |       The location of a Amberdata external adapter        | string |         |                                              |
|           |    COINAPI_ADAPTER_URL    |        The location of a CoinApi external adapter         | string |         |                                              |
|           |     NCFX_ADAPTER_URL      |          The location of a NCFX external adapter          | string |         |                                              |
|           | CFBENCHMARKS_ADAPTER_URL  |      The location of a CFBenchmarks external adapter      | string |         |                                              |
|           |    FINAGE_ADAPTER_URL     |         The location of a Finage external adapter         | string |         |                                              |
|    ✅     |          RPC_URL          |          The RPC URL to connect to the EVM chain          | string |         |                                              |
|    ✅     |         CHAIN_ID          |                The chain id to connect to                 | number |         |                     `1`                      |
|    ✅     |     MULTICALL_ADDRESS     |          The address of the Multicall3 contract           | string |         | `0xcA11bde05977b3631167028862bE2a173976CA11` |
|    ✅     |     REGISTRY_ADDRESS      | The address of the deployed APY.Finance Registry contract | string |         |                                              |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                           | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [allocations](#allocations-endpoint), [tvl](#tvl-endpoint) |  `tvl`  |

## Allocations Endpoint

`allocations` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "allocations"
  }
}
```

---

## Tvl Endpoint

`tvl` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | source |                |   The data provider to query data from   | string |         |         |            |                |
|           | quote  | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "tvl",
    "source": "coingecko",
    "quote": "EUR"
  }
}
```

---

MIT License
