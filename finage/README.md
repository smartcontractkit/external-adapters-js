# Chainlink Polygon External Adapter

This adapter is for [Finage.co.uk](https://finage.co.uk/) and supports the crypto endpoint.

### Environment Variables

| Required? |  Name   |                                   Description                                    | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://finage.co.uk/) |         |             |


## Price Endpoint

Get FOREX price conversions

### Input Params

| Required? |            Name            |                 Description                  |       Options       | Defaults to |
| :-------: | :------------------------: | :------------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The symbol of the currency to query      | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` |   The symbol of the currency to convert to   | `BTC`, `ETH`, `USD` |             |


### Output

```json
{"symbol":"BTCUSD","price":"57333.52000000"}
```
