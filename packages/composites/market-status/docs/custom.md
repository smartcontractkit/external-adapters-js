## Market Status Values

Returned integers depend on **`type`** (`regular` or `24/5`). See [Data Streams market hours](https://docs.chain.link/data-streams/market-hours) for session definitions.

### Regular (`type: regular`, default)

For **`market-status`** with `type: regular`, and for **`multi-market-status`** (which only supports `type: regular`), the result is one of three values:

| Value | Status  | Description                           |
| :---: | :------ | :------------------------------------ |
|   0   | Unknown | Market status could not be determined |
|   1   | Closed  | Market is closed                      |
|   2   | Open    | Market is open                        |

### 24/5 (`type: 24/5`)

For **`market-status`** with `type: 24/5`, values follow [US Equities 24/5 trading sessions](https://docs.chain.link/data-streams/market-hours#us-equities-245-trading-sessions) (same meanings as Data Streams `marketStatus` for the v11 schema):

| Value | Session       | Description                                                               |
| :---: | :------------ | :------------------------------------------------------------------------ |
|   0   | Unknown       | Market status could not be determined                                     |
|   1   | Pre-market    | Extended session before regular hours (e.g. 4:00am–9:30am ET Mon–Fri)     |
|   2   | Regular hours | Primary trading session (e.g. 9:30am–4:00pm ET Mon–Fri)                   |
|   3   | Post-market   | Extended session after regular hours (e.g. 4:00pm–8:00pm ET Mon–Fri)      |
|   4   | Overnight     | Overnight session (e.g. 8:00pm–4:00am ET Sun evening–Fri morning)         |
|   5   | Weekend       | Weekend / holiday windows as defined by the adapter (see `weekend` param) |

Times above follow the [market hours documentation](https://docs.chain.link/data-streams/market-hours); consult that page and the [24/5 US Equities User Guide](https://docs.chain.link/data-streams/rwa-streams/24-5-us-equities-user-guide) for precise cut-offs and holidays.

### Multi-market-status aggregation logic

The **`multi-market-status`** endpoint aggregates the status of multiple exchanges into a single value **using the regular (three-value) model above**. The default behavior (with `openMode: any` and `closedMode: all`) is:

- Returns **2 (Open)** if **any** of the underlying exchanges is open.
- Returns **1 (Closed)** only if **all** underlying exchanges are closed.
- Returns **0 (Unknown)** only if **all** underlying exchanges report unknown.

This means that on regular weekdays, as long as at least one exchange is operating, the feed will report Open. The feed will only report Closed during weekends and major public holidays when all exchanges are closed.
