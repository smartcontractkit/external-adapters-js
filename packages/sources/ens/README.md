# ENS Adapter

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ens/package.json)

ENS Adapter

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |       Description        |  Type  | Options | Default |
| :-------: | :-----: | :----------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL | A valid Ethereum RPC URL | string |         |         |

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
    "endpoint": "lookup",
    "resultPath": "address",
    "ensName": "mockinputethtld.eth"
  },
  "debug": {
    "cacheKey": "lBQVhNyHkF8nstGK9E/bmMFenGM="
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
    "endpoint": "lookup",
    "resultPath": "address",
    "ensName": "mockinputnonethtld.test"
  },
  "debug": {
    "cacheKey": "PzVHxnsdOTP9OEKRVKRD8YhU2dg="
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
    "endpoint": "lookup",
    "resultPath": "address",
    "ensName": "subdomain.mockinputethtld.eth"
  },
  "debug": {
    "cacheKey": "0LOWogTArOegT4oJa3Twh8ok+IM="
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
    "endpoint": "lookup",
    "resultPath": "address",
    "ensName": "subdomain.mockinputnonethtld.test"
  },
  "debug": {
    "cacheKey": "jDkQbMyh5qYQgHSDG0jRWgvx+cE="
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
