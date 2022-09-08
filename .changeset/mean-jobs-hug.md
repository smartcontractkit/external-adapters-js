---
'@chainlink/anchor-adapter': major
'@chainlink/apy-finance-adapter': major
'@chainlink/augur-adapter': major
'@chainlink/curve-3pool-adapter': major
'@chainlink/dxdao-adapter': major
'@chainlink/dydx-rewards-adapter': major
'@chainlink/nftx-adapter': major
'@chainlink/savax-price-adapter': major
'@chainlink/set-token-index-adapter': major
'@chainlink/vesper-adapter': major
'@chainlink/xsushi-price-adapter': major
'@chainlink/alpine-adapter': major
'@chainlink/ccip-read-adapter': major
'@chainlink/celsius-address-list-adapter': major
'@chainlink/chain-reserve-wallet-adapter': major
'@chainlink/cryptex-adapter': major
'@chainlink/curve-adapter': major
'@chainlink/ens-adapter': major
'@chainlink/enzyme-adapter': major
'@chainlink/eth-balance-adapter': major
'@chainlink/galaxis-adapter': major
'@chainlink/layer2-sequencer-health-adapter': major
'@chainlink/lido-adapter': major
'@chainlink/por-address-list-adapter': major
'@chainlink/spectral-macro-score-adapter': major
'@chainlink/stader-labs-adapter': major
'@chainlink/synthetix-debt-pool-adapter': major
'@chainlink/uniswap-v2-adapter': major
'@chainlink/uniswap-v3-adapter': major
'@chainlink/view-function-adapter': major
'@chainlink/ethwrite-adapter': major
---

Added CHAIN_ID environment variable and validation for connecting to blockchain endpoints. **WARNING:** Before upgrading, ensure the default CHAIN_ID value is correct for the chain(s) you use. If not, you need to explicitly set this env var. Please refer to the individual adapter README for more information.
