## Usage Notes

### evm endpoint network vs chainId input param

At least one of [`chainId` and `network`] must be present when using the `evm` endpoint.

The result is scaled to 18 decimals.

Additional env vars in the form `${NETWORK}_RPC_URL` and `${NETWORK}_RPC_CHAIN_ID` are required for each supported network.
