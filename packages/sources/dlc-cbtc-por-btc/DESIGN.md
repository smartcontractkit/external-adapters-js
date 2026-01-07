# DLC CBTC BTC Proof of Reserves Adapter

This adapter calculates the total Bitcoin reserves held across CBTC vault addresses by:

1. Querying the DLC.Link Attester API for xpub keys and deposit account IDs
2. Independently calculating Taproot (P2TR) addresses using BIP32/Taproot derivation
3. Verifying calculated addresses match the attestor-provided addresses
4. Summing UTXOs across all verified vault addresses

This trustless design ensures the adapter independently verifies all vault addresses rather than blindly trusting a provided address list.

## Configuration

| Variable                | Required | Default          | Description                                                             |
| ----------------------- | -------- | ---------------- | ----------------------------------------------------------------------- |
| `ATTESTER_API_URL`      | Yes      | -                | DLC.Link Attester API URL (e.g., `https://mainnet.dlc.link/attestor-1`) |
| `CHAIN_NAME`            | No       | `canton-mainnet` | Chain name filter (`canton-mainnet`, `canton-testnet`, `canton-devnet`) |
| `BITCOIN_RPC_ENDPOINT`  | Yes      | -                | Electrs-compatible Bitcoin blockchain API endpoint for UTXO queries     |
| `MIN_CONFIRMATIONS`     | No       | `6`              | Minimum confirmations required for a UTXO to be counted                 |
| `BACKGROUND_EXECUTE_MS` | No       | `10000`          | Interval in milliseconds between background executions                  |

## Endpoints

### `reserves`

Returns the total Bitcoin reserves across all vault addresses in **satoshis**.

**Aliases:** `por`

#### Example Request

```json
{
  "endpoint": "reserves"
}
```

#### Example Response

```json
{
  "result": "301089400",
  "data": {
    "result": "301089400"
  },
  "timestamps": {
    "providerDataRequestedUnixMs": 1765379632155,
    "providerDataReceivedUnixMs": 1765379633526
  },
  "statusCode": 200,
  "meta": {
    "adapterName": "DLC_CBTC_BTC_POR",
    "metrics": {
      "feedId": "N/A"
    }
  }
}
```

The `result` value represents the total reserves in **satoshis** (301089400 = ~3.01 BTC).

## How It Works

The adapter implements trustless proof of reserve calculation:

### 1. Fetch Address Data from Attester API

Queries `/app/get-address-calculation-data` to get:

- xpub keys for each Canton chain (threshold group public key)
- Deposit account IDs
- Bitcoin network (mainnet/testnet/regtest)

### 2. Calculate Taproot Addresses Independently

For each deposit account:

- Hash the deposit ID to derive a deterministic unspendable internal key
- Build a Taproot script: `<x_only_pubkey> OP_CHECKSIG`
- Create P2TR output with script-path spending
- Encode as Bech32m address

### 3. Verify Address Matches Attestor

Each calculated address is verified against the attestor-provided `address_for_verification`. If any address doesn't match, the adapter fails with an error, preventing potential manipulation.

### 4. Calculate Reserves

For each verified vault address:

- Query UTXOs at the address
- Sum only UTXOs with ≥`MIN_CONFIRMATIONS` confirmations
- Query mempool transactions for pending spends
- Add back pending spend input values to prevent temporary balance dip

### Pending Withdrawal Handling

When a withdrawal transaction is broadcast but not yet confirmed:

- The original UTXO is marked as "spent" (consumed by the pending tx)
- The new UTXO (change back to vault) is unconfirmed

The adapter detects pending spends by checking mempool transactions:

- If a pending tx has an input spending from a vault address, the input's value is added to reserves
- This ensures reserves remain stable during the confirmation window

## Running Locally

```bash
# Build
yarn build

# Set environment variables
export ATTESTER_API_URL="https://mainnet.dlc.link/attestor-1"
export CHAIN_NAME="canton-mainnet"
export BITCOIN_RPC_ENDPOINT="https://blockstream.info/api"

# Start
yarn start

# Query reserves (in another terminal)
curl -X POST http://localhost:8080 -H "Content-Type: application/json" -d '{"data": {"endpoint": "reserves"}}'
```

## Running Tests

```bash
# From repo root
yarn jest packages/sources/dlc-cbtc-por-btc/test/ --no-coverage
```

## Reference

Address calculation algorithm based on: https://github.com/DLC-link/cbtc-por-tools
