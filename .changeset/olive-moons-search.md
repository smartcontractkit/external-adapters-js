---
'@chainlink/coinmetrics-lwba-adapter': patch
'@chainlink/coinmetrics-adapter': patch
'@chainlink/blocksize-capital-adapter': patch
'@chainlink/cfbenchmarks-adapter': patch
'@chainlink/coingecko-adapter': patch
'@chainlink/coinmarketcap-adapter': patch
'@chainlink/coinpaprika-adapter': patch
'@chainlink/cryptocompare-adapter': patch
'@chainlink/finage-adapter': patch
'@chainlink/kaiko-adapter': patch
'@chainlink/ncfx-adapter': patch
'@chainlink/tiingo-adapter': patch
'@chainlink/token-allocation-adapter': patch
---

Apply RDD symbol overrides that were being silently dropped in coinmetrics-lwba, and move the token-allocation v3 adapter set to ea-framework 2.19.1
