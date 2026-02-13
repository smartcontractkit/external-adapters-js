## Market Status Values

The market-status and multi-market-status endpoints return one of three possible integer values:

| Value | Status  | Description                           |
| :---: | :------ | :------------------------------------ |
|   0   | Unknown | Market status could not be determined |
|   1   | Closed  | Market is closed                      |
|   2   | Open    | Market is open                        |

### Multi-market-status aggregation logic

The `multi-market-status` endpoint aggregates the status of multiple exchanges into a single value. The default behavior (with `openMode: any` and `closedMode: all`) is:

- Returns **2 (Open)** if **any** of the underlying exchanges is open.
- Returns **1 (Closed)** only if **all** underlying exchanges are closed.
- Returns **0 (Unknown)** only if **all** underlying exchanges report unknown.

This means that on regular weekdays, as long as at least one exchange is operating, the feed will report Open. The feed will only report Closed during weekends and major public holidays when all exchanges are closed.
