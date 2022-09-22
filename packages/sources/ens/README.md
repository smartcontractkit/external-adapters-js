# ENS Adapter

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ens/package.json)

ENS Adapter

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name   |        Description         |  Type  | Options | Default |
| :-------: | :------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL  |  A valid Ethereum RPC URL  | string |         |         |
|           | CHAIN_ID | The chain id to connect to | string |         |   `1`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [lookup](#lookup-endpoint) | `lookup` |

## Lookup Endpoint

Look up information about a human friendly ENS domain name

`lookup` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ensName |         | The ENS name to look up | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "ensName": "mockinputethtld.eth",
    "endpoint": "lookup",
    "resultPath": "address"
  },
  "debug": {
    "cacheKey": "JSErNmN8G275BpWeOunk+wT/938="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "registrant": "fake-registrar-ownerOf",
    "controller": "fake-registry-owner",
    "address": "0x0mockinputethtld.eth",
    "result": "0x0mockinputethtld.eth"
  },
  "result": "0x0mockinputethtld.eth",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "ensName": "mockinputnonethtld.test",
    "endpoint": "lookup",
    "resultPath": "address"
  },
  "debug": {
    "cacheKey": "v7iYX6aZnnAHPZbnu9UDSLvRrgw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "controller": "fake-registry-owner",
    "address": "0x0mockinputnonethtld.test",
    "result": "0x0mockinputnonethtld.test"
  },
  "result": "0x0mockinputnonethtld.test",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "ensName": "subdomain.mockinputethtld.eth",
    "endpoint": "lookup",
    "resultPath": "address"
  },
  "debug": {
    "cacheKey": "ykDmNZC347HfwpLF5sh41ZVPHBQ="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "controller": "fake-registry-owner",
    "address": "0x0subdomain.mockinputethtld.eth",
    "result": "0x0subdomain.mockinputethtld.eth"
  },
  "result": "0x0subdomain.mockinputethtld.eth",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "ensName": "subdomain.mockinputnonethtld.test",
    "endpoint": "lookup",
    "resultPath": "address"
  },
  "debug": {
    "cacheKey": "D5d+Lo5QhukVF6maB6ySrhTLy7E="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "controller": "fake-registry-owner",
    "address": "0x0subdomain.mockinputnonethtld.test",
    "result": "0x0subdomain.mockinputnonethtld.test"
  },
  "result": "0x0subdomain.mockinputnonethtld.test",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
