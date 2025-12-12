# DLC CBTC BTC Proof of Reserves Adapter

This adapter calculates the total Bitcoin reserves held across configured vault addresses by querying UTXOs directly from the Bitcoin blockchain.

## Configuration

| Variable               | Required | Default | Description                                             |
| ---------------------- | -------- | ------- | ------------------------------------------------------- |
| `BITCOIN_RPC_ENDPOINT` | Yes      | -       | Electrs-compatible Bitcoin blockchain API endpoint      |
| `VAULT_ADDRESSES`      | Yes      | -       | Comma-separated list of Bitcoin vault addresses         |
| `MIN_CONFIRMATIONS`    | No       | `6`     | Minimum confirmations required for a UTXO to be counted |

## Endpoints

### `reserves`

Returns the total Bitcoin reserves across all configured vault addresses in **satoshis**.

**Aliases:** `por`, `proof-of-reserves`

#### Example Request

```json
{
  "endpoint": "reserves"
}
```

#### Example Response

```json
{
  "result": 301089400,
  "data": {
    "result": 301089400
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

The `result` value represents the total reserves in **satoshis** (1085690422 = ~10.85 BTC).

## How It Works

The adapter implements iBTC-style proof of reserve calculation:

1. **Fetch block height** - Get current Bitcoin block height for confirmation calculation
2. **For each vault address:**
   - Query UTXOs at the address
   - Sum only UTXOs with ≥`MIN_CONFIRMATIONS` confirmations
   - Query mempool transactions for pending spends
   - Add back any pending spend input values to prevent temporary dip during withdrawal for unconfirmed txs
3. **Return aggregate total**

### Pending Withdrawal Handling

When a withdrawal transaction is broadcast but not yet confirmed:

- The original UTXO is marked as "spent" (consumed by the pending tx)
- The new UTXO (change back to vault) is unconfirmed

Without special handling, the adapter would report a balance that doesn't reflect the balance of only UTXOs confirmed to be spent

The adapter detects pending spends by checking mempool transactions:

- If a pending tx has an input spending from a vault address, the input's value is added to reserves
- This ensures reserves remain stable during the confirmation window
