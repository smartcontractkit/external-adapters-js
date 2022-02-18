---
'@chainlink/anchor-adapter': minor
---

update anchor EA to derive the USD/bETH price using the new method. This new method relies on pulling the stETH/ETH price from the pool's Curve contract. Because of this, a new optional environment variable named 'STETH_POOL_CONTRACT_ADDRESS' has been added with a default of '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'
