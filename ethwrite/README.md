# Chainlink External Adapter for writing to Ethereum-based Blockchains

This external adapter allows you to configure an endpoint and private key to sign and send transactions to external Ethereum-based blockchains.

A typical workflow of a Chainlink job for this external adapter could look like:

- Retrieve a piece of data from _some data source_
- Parse the desired field from that data source's response
- Utilize this adapter to write the value to ChainB
- Parse the transaction object from ChainB for the transaction hash
- Write the transaction hash from ChainB to ChainA

### Environment Variables

| Required? |       Name       |                             Description                             | Options | Defaults to |
| :-------: | :--------------: | :-----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |     RPC_URL      |  RPC endpoint for that client. For example `http://localhost:8545`  |         |             |
|    ✅     |   PRIVATE_KEY    | The private key of a funded account, to sign the transactions from. |         |             |
|    ✅     | CONTRACT_ADDRESS |       The contract address that the contract is deployed to.        |         |             |

---

### Input Parameters

| Required? |    Name    |                                       Description                                       |                                     Options                                     | Defaults to  |
| :-------: | :--------: | :-------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: | :----------: |
|    ✅     |   exAddr   |                       The address for sending the transaction to.                       |                                                                                 |              |
|           |   funcId   |                              The setter function to call:                               | [`0xc2b12a73`(for bytes32), `0xa53b1c1e`(for int256),`0xd2282dc5`(for uint256)] | `0xd2282dc5` |
|           |  dataType  | Pass this only in case you need to encode the data(normally should be already encoded). |                        [`bytes32`, `int256`, `uint256`]                         |              |
|           |   result   |                           The result of the previous adapter                            |                                                                                 |              |
|           | dataToSend |               If specified, this value will be sent instead of `result`.                |                                                                                 |              |

---

## Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "nonce": 1,
    "gasPrice": { "type": "BigNumber", "hex": "0x04a817c800" },
    "gasLimit": { "type": "BigNumber", "hex": "0x53d8" },
    "to": "0xBb5696deFD9005e0CfD8bf40ae4C1f9beB6c109d",
    "value": { "type": "BigNumber", "hex": "0x00" },
    "data": "0xa53b1c1e0000000000000000000000000000000000000000000000000000000000000036",
    "chainId": 1337,
    "v": 2710,
    "r": "0x58389e578005462f7e8d0c980cd4fca9e16ab4141882f56f98deec0b572da0b3",
    "s": "0x17a977f57a88c3dbbab89beac60beb78ae8ab4dffd676831f84d14151c5b03d5",
    "from": "0x78C696E4cA526f17380DAc7b6C5fd54B17F3f637",
    "hash": "0x311b1e57342f61379bc597813c41bfa7c3535cfc2a49e61b2456c602dd07708e"
  },
  "statusCode": 200
}
```
