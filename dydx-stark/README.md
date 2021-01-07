# Chainlink External Adapter for dydx-stark

## Configuration

The adapter takes the following environment variables:

- `PRIVATE_KEY`: The Ethereum private key used to sign the STARK_MESSAGE (required).
- `STARK_MESSAGE`: A constant message, determined ad hoc (for example "chainlinkStarkSig"), used in conjunction with the Etherum PRIVATE_KEY to generate the STARK private key (required).
- `ORACLE_NAME`: A constant name for this oracle, used as part of the data we sign using STARK private key (required).
- `API_ENDPOINT`: An API endpoint where the final signed payload will be sent (required).

## Input Params

- `endpoint`: Optional endpoint param, defaults to `send`

### Send endpoint

This endpoint will sign the input price data with your private STARK key, and send it to the destination endpoint.

- `dataPath`: Optional path where to find the price data, defaults to `result`
- `asset`: Required asset name (of your choice, per asset. for example "USDBTC")

The flow for a signing oracle node looks like this:

1.  Generate Ethereum signature on a constant message, determined ad hoc (for example "chainlinkStarkSig")
2.  Perform Keccak256 on the signature to get one 256-bit word
3.  Cut the last 5 bits of it to get your 251-bit-long private stark key
4.  Hash the following parameters (see the code for the detailed restrictions on sizes of all the fields):
    1. timestamp
    2. price
    3. asset name (of your choice, per asset. for example "USDBTC")
    4. oracle name (your identity. I.e. "Chain")
5.  Sign with your private stark key and the hash message to get r,s
6.  Generate the public key (pub_key) with your private key
7.  Communicate (time, price, asset_name, r, s, pub_key) to dYdX (the oracle_name should never change and is known to dYdX since they know they got it from you)

## Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
