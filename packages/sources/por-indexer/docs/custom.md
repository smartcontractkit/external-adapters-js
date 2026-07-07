## Known Issues

### Dependencies

The `por-indexer` balance endpoint queries the **streams Bitcoin indexer**, an Electrs-compatible REST API used by other adapters such as `dlc-cbtc-por`. It requires endpoints such as `/blocks/tip/height`, `/address/{addr}/utxo`, and `/address/{addr}/txs/mempool`.

Set `BITCOIN_MAINNET_RPC_URL` (and `BITCOIN_TESTNET_RPC_URL` if needed) to the same streams Bitcoin indexer base URL used for `BITCOIN_RPC_ENDPOINT` in `dlc-cbtc-por`.

Dogecoin is not supported by this adapter.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decided to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.
