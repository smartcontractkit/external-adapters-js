## Staging vs. Production

| Environment | URL                                                                       |
| ----------- | ------------------------------------------------------------------------- |
| Testnet     | `https://proof.t-rize.ca/v1/asset-verifier/merkle-tree/current-root`      |
| Mainnet     | `https://proof.t-rize.network/v1/asset-verifier/merkle-tree/current-root` |

The adapter defaults to the **production** endpoint. For testnet, set `API_ENDPOINT=https://proof.t-rize.ca/v1/asset-verifier/merkle-tree/current-root`.

## Output Shape

The adapter returns T-Rize carrier values and leaves any downstream stream-schema mapping or renaming to the jobspec.

Because the downstream stream still targets SmartData v9 carrier fields, the adapter truncates `root` and `contractId` to the leftmost 23 bytes and converts those truncated bytes to decimal strings. These are deterministic derived values for T-Rize to replicate during verification, not the full raw provider values.

| Field                                    | Type   | Description                                                      |
| ---------------------------------------- | ------ | ---------------------------------------------------------------- |
| `result`                                 | string | Leftmost 23 bytes of `root`, converted to a decimal string       |
| `data.root`                              | string | Leftmost 23 bytes of `root`, converted to a decimal string       |
| `data.contractId`                        | string | Leftmost 23 bytes of `contractId`, converted to a decimal string |
| `timestamps.providerIndicatedTimeUnixMs` | number | Provider timestamp from `computedAt` in Unix milliseconds        |

## Sample Output

```json
{
  "result": "1354379164455806330400696522124505861414782960378538491",
  "statusCode": 200,
  "data": {
    "root": "1354379164455806330400696522124505861414782960378538491",
    "contractId": "57162387792002371595947067494468869255362946836973445"
  },
  "timestamps": {
    "providerIndicatedTimeUnixMs": 1773147978000
  }
}
```
