# POLKADOT_BALANCE

![1.2.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polkadot-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |    Name    |                                           Description                                           |  Type  | Options | Default |
| :-------: | :--------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |  RPC_URL   |            The websocket URL used to retrieve balances from the Polkadot Relay Chain            | string |         |         |
|           | BATCH_SIZE | Number of requests to execute asynchronously before the adapter waits to execute the next batch | number |         |  `25`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases  |                                            Description                                            |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :-----------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | object[] |         |         |            |                |
|    ✅     | addresses.address |          |                                 an address to get the balance of                                  |  string  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "13nogjgyJcGQduHt8RtZiKKbt7Uy6py9hv1WMDZWueEcsHdh"
      },
      {
        "address": "126rjyDQEJm6V6YPDcN85hJDYraqB6hL9bFsvWLDnM8rLc3J"
      }
    ]
  }
}
```

---

MIT License
