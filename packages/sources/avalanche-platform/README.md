# AVALANCHE_PLATFORM

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/avalanche-platform/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                      Description                                       |  Type  | Options | Default |
| :-------: | :-------------: | :------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | P_CHAIN_RPC_URL | Full RPC URL for the avalanche platform chain (e.g. https://api.avax.network/ext/bc/P) | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |                             |              6              |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases  |                                            Description                                            |   Type   | Options |   Default   | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :-----------------------------------------------------------------------------------------------: | :------: | :-----: | :---------: | :--------: | :------------: |
|    ✅     |     addresses     | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | object[] |         |             |            |                |
|    ✅     | addresses.address |          |                                 an address to get the balance of                                  |  string  |         |             |            |                |
|           | addresses.network |          |                                 the name of the network protocol                                  |  string  |         | `avalanche` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt",
        "network": "avalanche-fuji"
      }
    ]
  }
}
```

---

MIT License
