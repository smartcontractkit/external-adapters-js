# Chainlink External Adapter for Binance DEX

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to
- `endpoint`: The path to get data from (optional)

### Endpoints

Use the `API_ENDPOINT` env variable to set the API endpoint to use.
This will default to `dex-asiapacific`.

<table>
    <thead>
        <tr>
            <th>Network</th>
            <th>Endpoint</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan=3>Mainnet</td>
            <td>dex-asiapacific</td>
        </tr>
        <tr>
            <td>dex-european</td>
        </tr>
        <tr>
            <td>dex-atlantic</td>
        </tr>
        <tr>
            <td rowspan=3>Testnet-Nile</td>
            <td>testnet-dex-atlantic</td>
        </tr>
        <tr>
            <td>testnet-dex-asiapacific</td>
        </tr>
    </tbody>
</table>

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "symbol":"BNB_BUSD-BD1",
        "baseAssetName":"BNB",
        "quoteAssetName":"BUSD-BD1",
        "priceChange":"-0.67720000",
        "priceChangePercent":"-4.1300",
        "prevClosePrice":"15.79610000",
        "lastPrice":"15.71260000",
        "lastQuantity":"5.59400000",
        "openPrice":"16.38980000",
        "highPrice":"16.39630000",
        "lowPrice":"15.71260000",
        "openTime":1592472051001,
        "closeTime":1592558451001,
        "firstId":"95085363-0",
        "lastId":"95288334-2",
        "bidPrice":"16.00820000",
        "bidQuantity":"7.91500000",
        "askPrice":"16.13910000",
        "askQuantity":"189.09900000",
        "weightedAvgPrice":"16.25508542",
        "volume":"1941.24500000",
        "quoteVolume":"31555.10329880",
        "count":163,
        "result":15.7126
    },
    "result":15.7126,
    "statusCode":200
}
```
