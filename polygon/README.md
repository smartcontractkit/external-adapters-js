# Chainlink Polygon External Adapter

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

## Input params

- `base` or `from`: The asset to query
- `quote` or `to`: The currency to conver to
- `endpoint`: The endpoint to query (default: conversion)

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "status": "success",
  "last": {
   "bid": 0.8131,
   "ask": 0.8133,
   "exchange": 48,
   "timestamp": 1587501544000
  },
  "from": "GBP",
  "to": "USD",
  "initialAmount": 1,
  "converted": 1.2299,
  "result": 1.2299
 },
 "result": 1.2299,
 "statusCode": 200
}
```
