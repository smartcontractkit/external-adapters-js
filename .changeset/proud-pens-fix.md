---
'@chainlink/elven-adapter': major
---

Add Elven adapter for fetching HOPE proof-of-reserves data.

- Adds new V3 EA for fetching data from Elven's proof-of-reserves API for HOPE.
- Returns a single value, the total fiat value of their reserves. Fiat value is determined by the API, and returned in the
  request response.
