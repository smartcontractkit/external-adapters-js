declare module 'caver-js'

interface LegacyTransaction {
  _type: string
  _from: string
  _gas: string
  _signature: signature
  _to: string
  _input: string
  _value: string
  _chainId: string
  _gasPrice: string
  _nonce: string
}
interface txResult {
  blockHash: string
  blockNumber: string
  contractAddress: string
  from: string
  gas: string
  gasPrice: string
  gasUsed: string
  input: string
  log: string[]
  logsBloom: string
  nonce: string
  senderTxHash: string
  signatures: signature[]
  status: string
  to: string
  transactionHash: string
  transactionIndex: string
  type: string
  typeInt: number
  value: string
}

interface signature {
  V: string
  R: string
  S: string
}
