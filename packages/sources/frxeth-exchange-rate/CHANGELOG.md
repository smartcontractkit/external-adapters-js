# @chainlink/frxeth-exchange-rate-adapter

## 1.0.0

### Major Changes

- 29720f068: Add frxETH-ETH Exchange Rate Adapter.

  - Adapter fetches the fraxETH-ETH exchange rate values from frxETH-ETH Dual Oracle contract.
  - Returns either priceHigh or priceLow, depending on the priceType parameter provided.
  - If `isBadData` flag is set in contract response, the EA returns an error.
