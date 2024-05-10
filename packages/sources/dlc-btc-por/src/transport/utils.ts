import { BigNumber } from 'ethers'

export interface RawVault {
  uuid: string
  protocolContract: string
  timestamp: BigNumber
  valueLocked: BigNumber
  creator: string
  status: number
  fundingTxId: string
  closingTxId: string
  btcFeeRecipient: string
  btcMintFeeBasisPoints: BigNumber
  btcRedeemFeeBasisPoints: BigNumber
  taprootPubKey: string
}

export interface BitcoinTransactionVectorOutput {
  value: number
  n: number
  scriptPubKey: {
    asm: string
    desc: string
    hex: string
    address: string
    type: string
  }
}

export interface BitcoinTransactionVectorInput {
  txid: string
  vout: number
  scriptSig: {
    axm: string
    hex: string
  }
  txinwitness: string[]
  sequence: number
}

export interface BitcoinTransaction {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: BitcoinTransactionVectorInput[]
  vout: BitcoinTransactionVectorOutput[]
  blockhash: string
  confirmations: number
  time: number
  blocktime: number
}

export interface Bip32 {
  public: number
  private: number
}

export interface BitcoinNetwork {
  messagePrefix: string
  bech32: string
  bip32: Bip32
  pubKeyHash: number
  scriptHash: number
  wif: number
  bytes: number
  versionBytes: number
}

export const bitcoin: BitcoinNetwork = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'bc',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
  bytes: 21,
  versionBytes: 1,
}

export const testnet: BitcoinNetwork = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
  bytes: 21,
  versionBytes: 1,
}

export const regtest: BitcoinNetwork = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'bcrt',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
  bytes: 21,
  versionBytes: 1,
}

export const getBitcoinNetwork = (networkName: string): BitcoinNetwork => {
  switch (networkName) {
    case 'mainnet':
      return bitcoin
    case 'testnet':
      return testnet
    case 'regtest':
      return regtest
    default:
      throw new Error('Invalid or missing bitcoin network name')
  }
}

export const FUNDED_STATUS = 1
