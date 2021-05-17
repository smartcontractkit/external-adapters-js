# Chainlink External Adapter for Coinranking

### Configuration

The adapter takes the following environment variables:

| Required? |   Name    | Description | Options | Defaults to |
| :-------: | :-------: | :---------: | :-----: | :---------: |
|    ✅     | `API_KEY` |             |         |             |

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "uuid": "razxDUgYGNAdQ",
    "symbol": "ETH",
    "name": "Ethereum",
    "color": "#3C3C3D",
    "iconUrl": "https://cdn.coinranking.com/rk4RKHOuW/eth.svg",
    "marketCap": "67553574467.68029345298295011983",
    "price": "597.54988244591797515936",
    "listedAt": 1438905600,
    "tier": 1,
    "change": "-3.2489547820247537",
    "rank": 2,
    "sparkline": [
      "622.54920071128925146503",
      "627.75815526021065248074",
      "614.62022751930660358338",
      "582.03100167832143287493",
      "585.85897807833693805269",
      "602.09314640959022161266",
      "608.45939575119077210091",
      "594.96323310102896398145",
      "592.84489886959346148871",
      "591.56590530925904693337",
      "595.98496562786174712029",
      "595.53530596567544942876",
      "596.34396976288323089828",
      "596.79270674949418043788",
      "589.07068513612933469447",
      "587.71926717956308214908",
      "592.66571237236510141269",
      "592.66446923221652041371",
      "588.69768417674784163212",
      "585.11513782577436185102",
      "583.48913791567724889267",
      "586.6615861443597494366",
      "591.30219306188429202581",
      "595.58337165918727113531",
      "597.78944178603742712873",
      "597.8199172288207770386",
      "597.54988244591797515936"
    ],
    "coinrankingUrl": "https://coinranking.com/coin/razxDUgYGNAdQ+ethereum-eth",
    "24hVolume": "18683624383.90031939587946829082",
    "btcPrice": "0.03128835814127048",
    "result": 597.549882445918
  },
  "result": 597.549882445918,
  "statusCode": 200
}
```
