# THE_NETWORK_FIRM

![1.5.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/the-network-firm/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |            Description            |  Type  | Options |                                   Default                                   |
| :-------: | :--------------: | :-------------------------------: | :----: | :-----: | :-------------------------------------------------------------------------: |
|           |   API_ENDPOINT   |        API Endpoint to use        | string |         | `https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/` |
|           | ALT_API_ENDPOINT |       TNF alt API Endpoint        | string |         |                      `https://api.ledgerlens.io/oc/v1`                      |
|           |  EMGEMX_API_KEY  | API key used for emgemx endpoint  | string |         |                                     ``                                      |
|           | URANIUM_API_KEY  | API key used for uranium endpoint | string |         |                                     ``                                      |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             30              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                Options                                                                                                                                | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [backed](#backed-endpoint), [balance](#mco2-endpoint), [emgemx](#emgemx-endpoint), [eurr](#eurr-endpoint), [gift](#gift-endpoint), [mco2](#mco2-endpoint), [reserve](#reserve-endpoint), [stbt](#stbt-endpoint), [uranium](#uranium-endpoint), [usdr](#usdr-endpoint) | `mco2`  |

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

## Emgemx Endpoint

`emgemx` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "emgemx"
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

## Uranium Endpoint

`uranium` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "uranium"
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

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                Description                 |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :----------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | client |         | The name of the TNF client to consume from | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "client": "acme"
  }
}
```

---

MIT License
