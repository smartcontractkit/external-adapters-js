# THE_NETWORK_FIRM

![1.2.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/the-network-firm/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |     Description     |  Type  | Options |                                   Default                                   |
| :-------: | :----------: | :-----------------: | :----: | :-----: | :-------------------------------------------------------------------------: |
|           | API_ENDPOINT | API Endpoint to use | string |         | `https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             30              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                    Options                                                                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [backed](#backed-endpoint), [balance](#mco2-endpoint), [eurr](#eurr-endpoint), [gift](#gift-endpoint), [mco2](#mco2-endpoint), [stbt](#stbt-endpoint), [usdr](#usdr-endpoint) | `mco2`  |

## Backed Endpoint

`backed` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | accountName |         | The account name to retrieve the total reserve for | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "backed",
    "accountName": "IBTA"
  }
}
```

---

## Eurr Endpoint

`eurr` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "eurr"
  }
}
```

---

## Gift Endpoint

`gift` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "gift"
  }
}
```

---

## Mco2 Endpoint

Supported names for this endpoint are: `balance`, `mco2`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "mco2"
  }
}
```

---

## Stbt Endpoint

`stbt` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "stbt"
  }
}
```

---

## Usdr Endpoint

`usdr` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "usdr"
  }
}
```

---

MIT License
