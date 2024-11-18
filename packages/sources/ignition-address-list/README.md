# IGNITION_ADDRESS_LIST

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ignition-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                                 Default                                 |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :---------------------------------------------------------------------: |
|    ✅     |   API_KEY    |   An API key for Data Provider    | string |         |                                                                         |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://fbtc.phalcon.blocksec.com/api/v1/extension/fbtc-reserved-addr` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                              Note                              |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------------: |
| default |                             |              6              |                           | The same IP address can only send one request within 5 seconds |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | network |         | The network name to associate with the addresses | string |         |         |            |                |
|    ✅     | chainId |         |   The chain ID to associate with the addresses   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "address",
    "network": "bitcoin",
    "chainId": "mainnet"
  }
}
```

---

MIT License
