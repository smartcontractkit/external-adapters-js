## Known Issues

### Per-network configuration

In addition to the `ETHEREUM_RPC_URL` and `ETHEREUM_CHAIN_ID` variable
described below, the adapter requires `<network>_RPC_URL` and
`<network>_RPC_CHAIN_ID` (where `<network>` is the upper case name of the
network) to be set for each supported network.

For example, to support Arbitrum, you would need to set the `ARBITRUM_RPC_URL`
and `ARBITRUM_RPC_CHAIN_ID` environment variables.

Note that this also means that `ETHEREUM_RPC_CHAIN_ID` needs to be set (to `1`)
even if `ETHEREUM_CHAIN_ID` (without `_RPC`) is already set.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.
