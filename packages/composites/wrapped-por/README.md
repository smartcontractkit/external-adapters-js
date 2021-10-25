# Chainlink Wrapped-PoR Composite Adapter

An adapter that uses [Wrapped](../../sources/wrapped/README.md) to get a list of recipients and [Proof of reserves](../proof-of-reserves/README.md) to get the sum of their balances

## Configuration

The adapter takes the following environment variables:

| Required? |           Name            |       Description        | Options | Defaults to |
| :-------: | :-----------------------: | :----------------------: | :-----: | :---------: |
|    ✅     | `ETH_BALANCE_ADAPTER_URL` | source adapter parameter |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |    Name    |             Description              |                          Options                           |  Defaults to  |
| :-------: | :--------: | :----------------------------------: | :--------------------------------------------------------: | :-----------: |
|           |  `symbol`  | The symbol of the currency to query  |                  `BTC`, `ETH`, `LTC`, etc                  |     `ETH`     |
|           | `protocol` | The protocol external adapter to use |                `renvm`, `wbtc`, `list`, etc                |    `list`     |
|           | `indexer`  | The indexer external adapter to use  | `bitcoin_json_rpc`, `blockchain_com`, `blockcypher`, `etc` | `eth_balance` |

#### Notes

See the [Proof of reserves README](../proof-of-reserves/README.md) for more information about ` protocol` and `indexer` params

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "3938711109096905",
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "result": "3938711109096905"
  }
}
```
