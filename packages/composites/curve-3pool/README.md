# Chainlink External Adapter to Calculate Curve 3Pool LP Token Price

The adapter calculates a price for the Curve 3Pool LP token. The price is defined as the liquidation value of an LP token.

Here's the relevant excerpted calculation from the 3Pool contract (vyper) for the redemption of an LP token:

```vyper
def remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS]):
    total_supply: uint256 = self.token.totalSupply()
    amounts: uint256[N_COINS] = empty(uint256[N_COINS])
    fees: uint256[N_COINS] = empty(uint256[N_COINS])  # Fees are unused but we've got them historically in event

    for i in range(N_COINS):
        value: uint256 = self.balances[i] * _amount / total_supply
        assert value >= min_amounts[i], "Withdrawal resulted in fewer coins than expected"
        self.balances[i] -= value
        amounts[i] = value

        # "safeTransfer" which works for ERC20s which return bool or not
        [... transfer logic snipped... `value` is sent to msg.sender]

    self.token.burnFrom(msg.sender, _amount)  # dev: insufficient funds
```

From the `remove_liquidity` function, we see that the transfer amount for each coin is:

```vyper
self.balances[i] * _amount / total_supply
```

In particular, when withdrawing a single LP token (`_amount == 1`) and
normalizing balances to be 18 decimals, we have (in python):

```python
# `balances` is as in the vyper code
# `prices` is list of coin prices in USD
amounts = [balances[i] * 10 ** (18 - decimals[i]) / total_supply for i in range(len(balances))]
lp_token_price = sum(prices[i] * amounts[i] // 10 ** 18)
```

The token allocation adapter will compute `lp_token_price` by pulling `prices` and taking
in the relevant `balances` and `decimals` from the `allocations` array.

- [Repo for 3Pool contracts](https://github.com/curvefi/curve-contract/tree/master/contracts/pools/3pool)
- [3Pool on Mainnet (etherscan)](https://etherscan.io/address/0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7)
- [3Pool LP token on Mainnet (etherscan)](https://etherscan.io/address/0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490)

## Configuration

The adapter takes the following environment variables:

| Required? |        Name        |                             Description                              | Options | Defaults to |
| :-------: | :----------------: | :------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `ETHEREUM_RPC_URL` | The Ethereum blockchain RPC endpoint to get the needed on-chain data |         |             |
|           |  `DEFAULT_QUOTE`   |         Currency that the price will be fetched by default.          |         |    `USD`    |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "sources": [],
    "payload": {
      "DAI": {
        "quote": {
          "USD": {
            "price": "1.00750541"
          }
        }
      },
      "USDC": {
        "quote": {
          "USD": {
            "price": "0.99465161"
          }
        }
      },
      "USDT": {
        "quote": {
          "USD": {
            "price": "1.00064981"
          }
        }
      }
    },
    "result": 18469823.762145024
  },
  "result": 18469823.762145024,
  "statusCode": 200
}
```
