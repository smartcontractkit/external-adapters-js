# Chainlink External Adapter for Enzyme

Adapter to interact with Enzyme contracts.

### Environment Variables

| Required? |  Name   |                                Description                                 | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | RPC_URL | An http(s) RPC URL to a blockchain node that can read the Enzyme contracts |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                    Options                    | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | calcNav, calcGav, calcNetValueForSharesHolder |   calcNav   |

---

## calcNetValueForSharesHolder Endpoint

Endpoint to call the `calcNetValueForSharesHolder` function on the contract.

### Input Params

| Required? |         Name         | Description | Options | Defaults to |
| :-------: | :------------------: | :---------: | :-----: | :---------: |
|    ✅     | `calculatorContract` |             |         |             |
|    ✅     |     `vaultProxy`     |             |         |             |
|    ✅     |    `sharesHolder`    |             |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "calcNetValueForSharesHolder",
    "calculatorContract": "0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A",
    "vaultProxy": "0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1",
    "sharesHolder": "0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "10000000000000000000",
  "statusCode": 200,
  "data": {
    "netValue": "10000000000000000000",
    "result": "10000000000000000000"
  }
}
```

## calc[Nav,Gav] Endpoint

Endpoint to call the `calc[Nav,Gav]` function on the contract.

### Input Params

| Required? |         Name         | Description | Options | Defaults to |
| :-------: | :------------------: | :---------: | :-----: | :---------: |
|    ✅     | `calculatorContract` |             |         |             |
|    ✅     |     `vaultProxy`     |             |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "calculatorContract": "0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A",
    "vaultProxy": "0x44902e5a88371224d9ac172e391C64257B701Ade"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "19995161270996618818245984400",
  "statusCode": 200,
  "data": {
    "nav": "19995161270996618818245984400",
    "result": "19995161270996618818245984400"
  }
}
```
