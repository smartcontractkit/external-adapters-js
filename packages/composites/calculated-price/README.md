# CALCULATED_PRICE

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/calculated-price/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Generic Environment Variables

The adapter takes the following environment variables to connect to its underlying source adapters:

| Required? |          Name          |                 Description                 | Options | Defaults to |
| :-------: | :--------------------: | :-----------------------------------------: | :-----: | :---------: |
|           | `[source]_ADAPTER_URL` | The adapter URL to query for any `[source]` |         |             |

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                      Options                                      |     Default     |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [computedprice](#computedprice-endpoint), [impliedprice](#computedprice-endpoint) | `computedprice` |

## Computedprice Endpoint

Supported names for this endpoint are: `computedprice`, `impliedprice`.

### Input Params

| Required? |         Name          |       Aliases        |                                  Description                                   |   Type   |       Options        | Default  | Depends On | Not Valid With |
| :-------: | :-------------------: | :------------------: | :----------------------------------------------------------------------------: | :------: | :------------------: | :------: | :--------: | :------------: |
|    ✅     |    operand1Sources    |  `dividendSources`   |          An array of source adapters to query for the operand1 value           | string[] |                      |          |            |                |
|    ✅     |     operand1Input     |   `dividendInput`    |                The JSON payload to send to the operand1 sources                |  string  |                      |          |            |                |
|           |  operand1MinAnswers   | `dividendMinAnswers` |    The minimum number of answers needed to return a value for the operand1     |  number  |                      |   `1`    |            |                |
|           | operand1DecimalsField |                      | The field path in operand1 response data containing the decimal scaling factor |  string  |                      |          |            |                |
|    ✅     |    operand2Sources    |   `divisorSources`   |          An array of source adapters to query for the operand2 value           | string[] |                      |          |            |                |
|    ✅     |     operand2Input     |    `divisorInput`    |                The JSON payload to send to the operand2 sources                |  string  |                      |          |            |                |
|           |  operand2MinAnswers   | `divisorMinAnswers`  |    The minimum number of answers needed to return a value for the operand2     |  number  |                      |   `1`    |            |                |
|           | operand2DecimalsField |                      | The field path in operand2 response data containing the decimal scaling factor |  string  |                      |          |            |                |
|           |       operation       |                      |                    The operation to perform on the operands                    |  string  | `divide`, `multiply` | `divide` |            |                |
|           |    outputDecimals     |                      |                         Decimal scaling of the result                          |  number  |                      |          |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "computedprice",
    "operand1Sources": ["coingecko"],
    "operand1MinAnswers": 1,
    "operand1Input": "{\"from\":\"LINK\",\"to\":\"USD\",\"overrides\":{\"coingecko\":{\"LINK\":\"chainlink\"}}}",
    "operand2Sources": ["coingecko"],
    "operand2MinAnswers": 1,
    "operand2Input": "{\"from\":\"ETH\",\"to\":\"USD\",\"overrides\":{\"coingecko\":{\"ETH\":\"ethereum\"}}}",
    "operation": "multiply"
  }
}
```

---

MIT License
