# Chainlink Savax-price Composite Adapter

This External Adapter pulls the price of `USD/sAVAX` from the Avalanche network. It exists as a composite EA as it derives the price using the Token Allocation EA.

## Configuration

The adapter takes the following environment variables:

| Required? |        Name         |                   Description                   | Options |                 Defaults to                  |
| :-------: | :-----------------: | :---------------------------------------------: | :-----: | :------------------------------------------: |
|    ✅     | `AVALANCHE_RPC_URL` | The RPC URL to connect to the Avalanche network |         |                                              |
|           |   `SAVAX_ADDRESS`   |        The address of the `sAVAX` token         |         | `0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE` |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

### Input Params

N/A

### Sample Input

```json
{
  "id": "1",
  "data": {
    "source": "coinpaprika"
  }
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "72589036398833726859",
  "statusCode": 200,
  "data": {
    "result": "72589036398833726859"
  }
}
```
