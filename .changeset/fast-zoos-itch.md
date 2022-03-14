---
'@chainlink/oilpriceapi-adapter': patch
'@chainlink/paxos-adapter': patch
'@chainlink/polygon-adapter': patch
'@chainlink/satoshitango-adapter': patch
'@chainlink/sochain-adapter': patch
'@chainlink/sportsdataio-adapter': patch
'@chainlink/therundown-adapter': patch
'@chainlink/tiingo-adapter': patch
'@chainlink/tradingeconomics-adapter': patch
'@chainlink/uscpi-one-adapter': patch
'@chainlink/xbto-adapter': patch
---

Added buildUrl & buildUrlPath methods to util. Updated source adapters to use these methods for building URLs with user input.
