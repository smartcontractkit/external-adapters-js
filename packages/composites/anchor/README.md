# Chainlink Anchor Composite Adapter

This composite adapter fetches the price of a given token from the Anchor protocol.

## Configuration

The adapter takes the following environment variables:

| Required? |                Name                |                         Description                         |                                             Options                                             |                  Defaults to                   |
| :-------: | :--------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------------------------------------------: | :--------------------------------------------: |
|    ✅     |         `ETHEREUM_RPC_URL`         |                The URL to Ethereum RPC node                 |                                                                                                 |                                                |
|           |  `ANCHOR_VAULT_CONTRACT_ADDRESS`   |          The address of the Anchor Vault contract           | Address can be found [here](https://docs.anchorprotocol.com/smart-contracts/deployed-contracts) |  `0xA2F987A546D4CD1c607Ee8141276876C26b72Bdf`  |
|           | `TERRA_BLUNA_HUB_CONTRACT_ADDRESS` |           The address of bLuna contract in Terra            | Address can be found [here](https://docs.anchorprotocol.com/smart-contracts/deployed-contracts) | `terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts` |
|           |   `STETH_POOL_CONTRACT_ADDRESS`    |                The address of stEth contract                |                   Address can be found by finding the stETH/ETH pool in Curve                   |  `0xdc24316b9ae028f1497c275eb9192a3ea0f67022`  |
|           |     `LUNA_TERRA_FEED_ADDRESS`      |              The Terra address of `LUNA` feed               |        Address can be found by here https://docs.chain.link/docs/terra/data-feeds-terra/        | `terra1gfy9nxj2xwd4vcupzfelk34u3qjkvp3vcjveg6` |
|           |      `ETH_TERRA_FEED_ADDRESS`      |               The Terra address of `ETH` feed               |        Address can be found by here https://docs.chain.link/docs/terra/data-feeds-terra/        | `terra1a39jndcuh64ef2qzt5w8mh46m5ysc34a9qd2e5` |
|           |          `FEED_DECIMALS`           | The number of decimals the feed should return for the price |                                                                                                 |                       8                        |

**Additional environment variables must be set according to the Terra View Function adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../../sources/terra-view-function/README.md](../../sources/terra-view-function/README.md) for more details.

| Required? |         Name         |                                                     Description                                                      | Options | Defaults to  |
| :-------: | :------------------: | :------------------------------------------------------------------------------------------------------------------: | :-----: | :----------: |
|    ✅     | `COLUMBUS_5_LCD_URL` | The URL to a Terra `columbus-5` full node to query on-chain mainnet data. At least 1 of 3 LCD_URLs must be provided. | string  |              |
|    ✅     | `BOMBAY_12_LCD_URL`  | The URL to a Terra `bombay-12` full node to query on-chain testnet data. At least 1 of 3 LCD_URLs must be provided.  | string  |              |
|    ✅     | `LOCALTERRA_LCD_URL` |   The URL to a locally running Terra full node to query on-chain data. At least 1 of 3 LCD_URLs must be provided.    | string  |              |
|           |  `DEFAULT_CHAIN_ID`  |                               The default `chainId` value to use as an input parameter                               | string  | `columbus-5` |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Price Endpoint

### Input Params

| Required? |            Name            |                                 Description                                 |     Options     | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------------------------: | :-------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                     The symbol of the currency to query                     | `BEth`, `BLuna` |             |
|    ✅     | `quote`, `to`, or `market` |                  The symbol of the currency to convert to                   |  `ETH`, `USD`   |             |
|           |      `quoteDecimals`       | The number of decimals of the `to` coin. Can be left blank if `to` is `USD` |                 |     18      |
|           |          `source`          |  The data provider to query. This is required if not specified in config.   |                 |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "BETH",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "2898433986830163904275",
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "result": "2898433986830163904275"
  }
}
```

#### BLuna Additional params

N/A

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "BLuna",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "89070558247315713497",
  "statusCode": 200,
  "data": {
    "result": "89070558247315713497"
  }
}
```
