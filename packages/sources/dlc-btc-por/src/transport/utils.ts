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

export interface BitcoinTransactionStatus {
  confirmed: boolean
  block_height?: number | null
  block_hash?: string | null
  block_time?: number | null
}

export interface BitcoinTransactionPegOut {
  genesis_hash: string
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_address: string
}

export interface BitcoinTransactionIssuance {
  asset_id: string
  is_reissuance: boolean
  asset_blinding_nonce: number
  asset_entropy: number
  contract_hash: string
  assetamount?: number
  assetamountcommitment?: number
  tokenamount?: number
  tokenamountcommitment?: number
}

export interface BitcoinTransactionVectorOutput {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address: string
  value: number
  valuecommitment?: number
  asset?: string
  assetcommitment?: number
  pegout?: BitcoinTransactionPegOut | null
}

export interface BitcoinTransactionVectorInput {
  inner_redeemscript_asm?: string
  inner_witnessscript_asm?: string
  is_coinbase: boolean
  is_pegin?: boolean
  issuance?: BitcoinTransactionIssuance | null
  prevout: BitcoinTransactionVectorOutput
  scriptsig: string
  scriptsig_asm: string
  sequence: number
  txid: string
  vout: number
  witness: string[]
}

export interface BitcoinTransaction {
  fee: number
  locktime: number
  size: number
  status: BitcoinTransactionStatus
  tx_type?: string
  txid: string
  version: number
  vin: BitcoinTransactionVectorInput[]
  vout: BitcoinTransactionVectorOutput[]
  weight: number
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
      return bitcoin
  }
}
