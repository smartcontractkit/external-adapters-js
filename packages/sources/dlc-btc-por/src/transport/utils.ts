import { BigNumber } from 'ethers'
import { BIP32Factory } from 'bip32'
import * as ellipticCurveCryptography from '@bitcoinerlab/secp256k1'
import { Network } from 'bitcoinjs-lib'
import { p2tr, p2tr_ns, P2TROut } from '@scure/btc-signer'
import { hexToBytes } from '@noble/hashes/utils'

export interface RawVault {
  uuid: string
  protocolContract: string
  timestamp: BigNumber
  valueLocked: BigNumber
  creator: string
  status: number
  fundingTxId: string
  wdTxId?: string
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

const bip32 = BIP32Factory(ellipticCurveCryptography)

// Gets the derived public key from the extended public key.
export const getDerivedPublicKey = (extendedPublicKey: string, bitcoinNetwork: Network): Buffer => {
  return bip32.fromBase58(extendedPublicKey, bitcoinNetwork).derivePath('0/0').publicKey
}

export const TAPROOT_UNSPENDABLE_KEY_HEX =
  '0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0'

// Creates an Unspendable Key Committed to the Vault UUID.
export function getUnspendableKeyCommittedToUUID(
  vaultUUID: string,
  bitcoinNetwork: Network,
): string {
  const publicKeyBuffer = Buffer.from(TAPROOT_UNSPENDABLE_KEY_HEX, 'hex')
  const chainCodeBuffer = Buffer.from(vaultUUID.slice(2), 'hex')

  const unspendablePublicKey = bip32
    .fromPublicKey(publicKeyBuffer, chainCodeBuffer, bitcoinNetwork)
    .toBase58()

  return unspendablePublicKey
}

export const getXOnlyPublicKey = (publicKey: Buffer): Buffer => {
  return publicKey.length === 32 ? publicKey : publicKey.subarray(1)
}

/**
 * Creates a Taproot Multisig Payment.
 * @param unspendableDerivedPublicKey - The Unspendable Derived Public Key.
 * @param attestorDerivedPublicKey - The Attestor Derived Public Key.
 * @param userDerivedPublicKey - The User Derived Public Key.
 * @param bitcoinNetwork - The Bitcoin Network to use.
 * @returns The Taproot Multisig Payment.
 */
export const createTaprootMultisigPayment = (
  unspendableDerivedPublicKey: Buffer,
  publicKeyA: Buffer,
  publicKeyB: Buffer,
  bitcoinNetwork: Network,
): P2TROut => {
  const unspendableDerivedPublicKeyFormatted = getXOnlyPublicKey(unspendableDerivedPublicKey)

  const publicKeys = [getXOnlyPublicKey(publicKeyA), getXOnlyPublicKey(publicKeyB)]
  const sortedArray = publicKeys.sort((a, b) => (a.toString('hex') > b.toString('hex') ? 1 : -1))

  const taprootMultiLeafWallet = p2tr_ns(2, sortedArray)

  return p2tr(unspendableDerivedPublicKeyFormatted, taprootMultiLeafWallet, bitcoinNetwork)
}

export function validateScript(script: Uint8Array, outputScript: Uint8Array) {
  return (
    outputScript.length === script.length &&
    outputScript.every((value, index) => value === script[index])
  )
}

export function getScriptMatchingOutputFromTransaction(
  bitcoinTransaction: BitcoinTransaction,
  script: Uint8Array,
) {
  return bitcoinTransaction.vout.find((output) =>
    validateScript(script, hexToBytes(output.scriptPubKey.hex)),
  )
}
