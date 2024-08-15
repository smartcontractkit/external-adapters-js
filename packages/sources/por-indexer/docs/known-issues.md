## Known Issues

### Dependencies

The `por-indexer` external adapter is strongly dependent on a synced `bitcoin-por-indexer` service and will not be functional without it.

Follow [this deployment documentation](https://chainlink.notion.site/Bitcoin-Proof-of-Reserves-v2-e670b124e429466bbb31988c6836a9da) to set up a `bitcoin-por-indexer` service. Note that sync time may take weeks in certain cases.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.
