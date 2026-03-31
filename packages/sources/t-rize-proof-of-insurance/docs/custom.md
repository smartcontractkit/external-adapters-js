## Staging vs. Production

| Environment | URL                                 |
| ----------- | ----------------------------------- |
| Testnet     | `https://proof.validator.t-rize.ca` |
| Mainnet     | `https://proof.t-rize.network`      |

The adapter defaults to the **testnet** URL. For mainnet, set `API_ENDPOINT=https://proof.t-rize.network`.

## SmartData v9 Field Mapping

The T-Rize API returns a merkle tree response that is mapped to SmartData v9 fields as follows:

| API Field     | v9 Field      | Type   | Encoding                                                                                                                    |
| ------------- | ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `root`        | `navPerShare` | int192 | Base64 decoded to bytes, truncated to leftmost 24 bytes, validated to fit positive `int192`, interpreted as BigInt (string) |
| `contractId`  | `aum`         | int192 | Hex string truncated to leftmost 48 hex chars (24 bytes), validated to fit positive `int192`, parsed as BigInt (string)     |
| `computedAt`  | `navDate`     | uint64 | ISO-8601 timestamp converted to nanoseconds since epoch (string)                                                            |
| _(hardcoded)_ | `ripcord`     | uint32 | Always `0` (normal state)                                                                                                   |

Values are truncated before conversion and validated to fit positive `int192`. If a truncated value still falls outside that range, the adapter returns a `502` instead of silently coercing it.

`treeId` from the API response is not mapped to a v9 field.

## Sample Output

```json
{
  "result": "346721066100686420582578309663873500522184437856905853753",
  "statusCode": 200,
  "data": {
    "navPerShare": "346721066100686420582578309663873500522184437856905853753",
    "aum": "14633571274752607128562449278584030529372914390265201950",
    "navDate": "1773147978000000000",
    "ripcord": 0
  }
}
```
