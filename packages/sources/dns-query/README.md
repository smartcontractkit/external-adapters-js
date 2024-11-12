# Chainlink External Adapter to query DNS

![1.6.29](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dns-query/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

DNS Query lets query DNS over HTTPS (DoH)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                         Description                          |  Type  |        Options         | Default |
| :-------: | :-------------: | :----------------------------------------------------------: | :----: | :--------------------: | :-----: |
|    ✅     |  DNS_PROVIDER   |                     DNS provider to use                      | string | `cloudflare`, `google` |         |
|           | CUSTOM_ENDPOINT | DNS provider URL to override default URLs for `DNS_PROVIDER` | string |                        |         |

---

## Data Provider Rate Limits

| Name | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |              Note               |
| :--: | :-------------------------: | :-------------------------: | :-----------------------: | :-----------------------------: |
| free |             100             |                             |                           | cloudflare @ 100, google @ 1500 |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                            Options                             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [dnsProof](#dnsproof-endpoint), [dnsQuery](#dnsquery-endpoint) | `dnsQuery` |

## DnsQuery Endpoint

DNS Query lets query DNS over HTTPS (DoH)

`dnsQuery` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |                                      Description                                       | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :------------------------------------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | name |         |                             Query Name, eg. "example.com"                              |      |         |         |            |                |
|    ✅     | type |         |                 Query Type (either a numeric value or text), eg. "TXT"                 |      |         |         |            |                |
|           |  do  |         | DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true" |      |         |         |            |                |
|           |  cd  |         |   CD bit - set to disable validation (either boolean or numeric value), eg. "false"    |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## DnsProof Endpoint

Check Google’s DNS service to determine if a given domain is owned by a given blockchain address.

`dnsProof` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |  Aliases  |                      Description                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-------: | :---------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  name  | `domain`  |        The domain name to check ownership of.         | string |         |         |            |                |
|    ✅     | record | `address` | The Ethereum address to check a given domain against. | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "dnsProof",
    "name": "www5.infernos.io",
    "record": "0xf75519f611776c22275474151a04183665b7feDe"
  },
  "debug": {
    "cacheKey": "98615ee48df7696e0c0b798d3956bb3904d880d2"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": true
  },
  "result": true,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
