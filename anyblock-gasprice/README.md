# Chainlink External Adapter for Anyblock Analytics Gas Price

## Gas Price Endpoint

### Input Params

| Required? |    Name    |    Description    |              Options               |        Defaults to        |
| :-------: | :--------: | :---------------: | :--------------------------------: | :-----------------------: |
|    🟡     |  `speed`   | The desired speed | `slow`,`standard`,`fast`,`instant` |        `standard`         |
|    🟡     | `endpoint` |                   |                                    | `latest-minimum-gasprice` |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "health": true,
    "blockNumber": 10012565,
    "blockTime": 13.49748743718593,
    "slow": 7.590000233,
    "standard": 8.250000233,
    "fast": 12,
    "instant": 15.4,
    "result": 12000000000
  },
  "result": 12000000000,
  "statusCode": 200
}
```
