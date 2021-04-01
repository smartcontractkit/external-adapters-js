# General JSON-RPC External Adapter for Chainlink

- Should work for any JSON RPC supported endpoint (includes tests for a few major projects which support JSON RPC commands)
- Supports AWS Lambda and GCP Functions
- Blockchain clients can sign and send transactions if wallet is unlocked

What this adapter does is allow you to specify the `"method"` and `"params"` values in a Chainlink request and receive the result (format example below) back to the Chainlink node for further processing.

In Solidity, a Chainlink request can be made to an external chain for the balance of a given account with the following example:

```javascript
function getBalanceExternalChain(string _account)
  public
  onlyOwner
{
  Chainlink.Request memory req = newRequest(JOB_ID, this, this.fulfillRPCCall.selector);
  req.add("method", "eth_getBalance");
  string[] memory params = new string[](2);
  path[0] = _account;
  path[1] = "latest";
  req.addStringArray("params", params);
  chainlinkRequest(req, ORACLE_PAYMENT);
}
```

### Environment Variables

| Required? |   Name    |               Description               | Options |      Defaults to      |
| :-------: | :-------: | :-------------------------------------: | :-----: | :-------------------: |
|           | `RPC_URL` | environment variable to your client URL |         | http://localhost:8545 |

See [testing](#testing) for information on other potential endpoints depending on the blockchain network and node type.

## Endpoint

Depending on the blockchain, input parameter values and returned responses will vary.

| Required? |     Name     |             Description              | Options | Defaults to |
| :-------: | :----------: | :----------------------------------: | :-----: | :---------: |
|    ✅     |   `method`   |     JSON-RPC method to be called     |         |             |
|           | `params` | Array of parameters for the `method` |         |             |

### Sample Input

```JSON
{
	"jsonrpc": "2.0",
	"method": "some_method",
	"params": [
		"some_param",
		"another_param"
	],
	"id": 1
}
```

### Sample Output
```JSON
{
  "id":1,
  "jsonrpc": "2.0",
  "result": "some_result"
}
```

## Testing

Testing is dependent on the type of node you're connecting to. You can set a local environment variable `RPC_URL` to point to an RPC connection. Otherwise, the adapter will default to `"http://localhost:8545"`.

RPC Address and Port Defaults:

- Ethereum: http://localhost:8545
- AION: http://localhost:8545
- BTC: (bitcoind) http://localhost:8332 (btcd) http://localhost:8334
- Zilliqa: http://localhost:4201

For Ethereum and any Geth clone (should work with Parity as well):

Make sure you run these commands from the ROOT of this monorepo.

```bash
yarn test json-rpc/test/integration/eth
```

For Bitcoin:

```bash
yarn test json-rpc/test/integration/btc
```

For AION:

```bash
yarn test json-rpc/test/integration/aion
```

For Zilliqa:

```bash
RPC_URL=https://dev-api.zilliqa.com yarn test json-rpc/test/integration/zilliqa
```
