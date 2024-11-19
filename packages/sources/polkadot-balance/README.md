# POLKADOT_BALANCE

![1.3.16](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polkadot-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |         Name          |                                           Description                                           |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |            The websocket URL used to retrieve balances from the Polkadot Relay Chain            | string |         |         |
|           |      BATCH_SIZE       | Number of requests to execute asynchronously before the adapter waits to execute the next batch | number |         |  `25`   |
|           | BACKGROUND_EXECUTE_MS |    The amount of time the background execute should sleep before performing the next request    | number |         | `10000` |

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
