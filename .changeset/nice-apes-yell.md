---
'@chainlink/dlc-btc-por-adapter': major
---

Modified vault fetching logic, added support for multiple networks.
[Breaking Changes]
Replaced DLC_CONTRACT env variable with 'dlcContract' input parameter.
Replaced RPC_URL, CHAIN_ID env variables with network-specific env variables ( {NETWORK}\_RPC_URL, {NETWORK}\_CHAIN_ID ).
Added new 'network' input parameter to specify the network.
