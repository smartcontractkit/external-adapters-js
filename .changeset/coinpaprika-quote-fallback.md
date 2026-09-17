---
'@chainlink/coinpaprika-adapter': patch
---

Drop markprice websocket messages that specify 'quote_fallback', indicating Coinpaprika failed to normalize the quote currency. Also drop markprice websocket messages that violate the price invariant bid < price < ask
