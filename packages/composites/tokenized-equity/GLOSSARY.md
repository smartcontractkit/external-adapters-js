# Tokenized Equity

Prices for tokenized equities: an equity price from data-engine, scaled to what one token
of an Issuer's asset is worth.

## Language

### Prices

**24/7 Price**:
A blended, smoothed price from a data-engine 24/7 stream, produced upstream and used by the
EA as is, with no session or market-hours logic.
_Avoid_: always-on price, weekend price

**24/5 Price**:
The session-aware, optionally smoothed price derived from regular, extended and overnight
streams.
_Avoid_: regular price, smoothed price

**Market Status**:
The trading-session state carried in a data-engine report, such as open, closed,
pre-market or overnight. Unrelated to Asset Paused.
_Avoid_: market paused, session status

### Issuers

**Issuer**:
The company that mints a tokenized equity and publishes its Issuer Multiplier: Robinhood,
Coinbase, Ondo or xStocks.
_Avoid_: provider, platform

**Issuer Multiplier**:
The on-chain ratio of underlying shares to one token, set by the Issuer as a fixed-point
integer.
_Avoid_: uiMultiplier, sValue, share ratio, conversion rate

**Asset Paused**:
An Issuer-set on-chain flag saying the Issuer has halted pricing for a token, usually
around a corporate action.
_Avoid_: market paused, oracle paused, halted
