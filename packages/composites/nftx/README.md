# Chainlink Nftx Composite Adapter

Queries NFT collection prices from NFTX vaults. While the ERC20 vTokens for each collection vault trade openly, the actual cost for purchasing an NFT from a vault incorporates additional fees.

For the PUNK vault this is calculated as follows:

```
vaultFee = vault.randomRedeemFee() / 1e18
price = 1 / [WETH/PUNK price from uniswap-v2 adapter]
priceWithFees =  price * (1 + vaultFee)
```

## Configuration

The adapter takes the following environment variables:

| Required? |        Name        |    Description    | Options | Defaults to |
| :-------: | :----------------: | :---------------: | :-----: | :---------: |
|    ✅     | `ETHEREUM_RPC_URL` | URL of RPC to use |         |             |

**Additional environment variables must be set for the Uniswap V2 adapter.**

This composite adapter utilizes the Uniswap V2 adapter for querying ERC20 prices, but from Sushiswap liquidity pools. For these queries to work, the `ROUTER_CONTRACT` environment variable must be overridden with the address of the Sushi router. See [../../sources/uniswap-v2/README.md](../../sources/uniswap-v2/README.md) for more information.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Price Endpoint

Calculates the random redemption price for an NFT on NFTX if the vTokens used were purchased from the associated Sushi pool.

### Input Params

| Required? |                     Name                     |              Description               | Options | Defaults to |
| :-------: | :------------------------------------------: | :------------------------------------: | :-----: | :---------: |
|    ✅     | `address`, `tokenAddress`, or `vaultAddress` | The address of the NFTX vault to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "address": "0x269616d549d7e8eaa82dfb17028d0b212d11232a"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "fee": "0.02",
    "price": "66.592359631913713045",
    "priceWithFee": "67.924206824551987306"
  },
  "statusCode": 200
}
```
