# GOLD

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/gold/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |             Name             |                                     Description                                     |  Type  | Options |                               Default                                |
| :-------: | :--------------------------: | :---------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------------------------------: |
|           |         XAU_FEED_ID          |                        Feed ID for XAU/USD price data stream                        | string |         | `0x0008991d4caf73e8e05f6671ef43cee5e8c5c3652a35fde0b0942e44a77b0e89` |
|           | TOKENIZED_GOLD_PRICE_STREAMS | JSON object of streams to use to derive a gold price when the main market is closed | string |         |                                  `{                                  |

      "XAUT": "0x0003b8b3f33c4c06a7947e86c5b4db4ef0991637d9821b9cdf897c0b5d488468",
      "PAXG": "0x0003b4b1d926719d4f67a08c9ffe9baf688620058c9f029923ea504eb71c877f"
    }` |

| | PRICE_STALE_TIMEOUT_MS | The amount of time in milliseconds before a price is considered stale if there has been no change | number | | `300000` |
| | PREMIUM_EMA_TAU_MS | Time constant (tau) in milliseconds for the EMA filters used to calculate the average premium of tokenized streams over the XAU price | number | | `1000000` |
| | DEVIATION_EMA_TAU_MS | Time constant (tau) in milliseconds for the EMA filters used to calculate the smoothed deviation from the XAU closing price | number | | `1000000` |
| | DEVIATION_CAP | Maximum deviation allowed from the closing price. Used deviation is clamped between this and minus this value. | number | | `0.02` |
| | TOKENIZED_PRICE_WEIGHT | Weight given to the tokenized stream derived price when calculating the composite price. 1.0 equals 100% | number | | `0.7` |
| | CACHE_TTL_MS | How long to keep the state in the cache in milliseconds before reinitializing | number | | `604800000` |
| ✅ | DATA_ENGINE_ADAPTER_URL | URL of data engine ea | string | | |
| | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number | | `1000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "price"
  }
}
```

---

MIT License
