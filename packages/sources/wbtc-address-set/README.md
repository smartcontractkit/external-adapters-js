# WBTC

![2.1.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wbtc-address-set/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                  Description                                  |  Type  | Options | Default |
| :-------: | :----------------: | :---------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |  MEMBERS_ENDPOINT  | wBTC endpoint of members (and their addresses). Required for members endpoint | string |         |         |
|           | ADDRESSES_ENDPOINT |          wBTC endpoint of addresses. Required for addresses endpoint          | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |                             |              6              |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                            Options                             |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [addresses](#addresses-endpoint), [members](#members-endpoint) | `addresses` |

## Addresses Endpoint

`addresses` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "addresses"
  }
}
```

---

## Members Endpoint

`members` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "members"
  }
}
```

---

MIT License
