## Known Issues

### ETH Beacon API version

Starting from version 3.0.0, the eth-beacon EA is compatible with the ETH Beacon API(`ETH_CONSENSUS_RPC_URL`) version 2.5.0 or later. If you are using an older version of the ETH Beacon API, you will need to upgrade it to 2.5.0 or later to use the eth-beacon EA.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.
