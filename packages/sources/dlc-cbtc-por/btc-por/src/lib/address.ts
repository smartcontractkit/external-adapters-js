/**
 * Bitcoin Address Calculation for CBTC Bridge
 *
 * This module independently calculates Bitcoin deposit addresses for the CBTC bridge.
 * The key principle is TRUSTLESSNESS - we calculate every address from the threshold
 * public key and deposit account IDs, then verify they match what the attestor reports.
 *
 * Based on: https://github.com/DLC-link/cbtc-por-tools
 */

import { makeLogger } from '@chainlink/external-adapter-framework/util'
import BIP32Factory from 'bip32'
import * as bitcoin from 'bitcoinjs-lib'
import * as crypto from 'crypto'
import * as ecc from 'tiny-secp256k1'
import { buildUrl } from './por'
import { AttesterAddressResponse, ChainAddressGroup } from './types'

const logger = makeLogger('BtcAddress')

// Initialize ECC library for bitcoinjs-lib (required for Taproot operations)
bitcoin.initEccLib(ecc)

// Initialize BIP32 library with elliptic curve implementation
const bip32 = BIP32Factory(ecc)

/**
 * Unspendable Public Key for DLC (Discreet Log Contract) Taproot Addresses
 *
 * This is the "Nothing Up My Sleeve" (NUMS) point used in BIP-341 Taproot.
 * It's derived by hashing "UNSPENDABLE" and using the result as a seed for
 * a provably unspendable public key.
 *
 * For DLC.Link's CBTC bridge, this key serves as the Taproot internal key:
 * - The internal key must be unspendable to ensure funds can only be spent
 *   via the script path (which requires the threshold signature)
 * - Using a fixed, verifiable NUMS point ensures no party has the private key
 * - This matches the Rust implementation in dlc-btc-lib reference implementation
 *
 * The key is 33 bytes in compressed format (02 prefix + 32-byte x-coordinate).
 * Reference: https://github.com/DLC-link/dlc-btc-lib
 */
const UNSPENDABLE_PUBLIC_KEY = '0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0'

/**
 * Hash a string using SHA-256
 * Used to derive the chain code for the unspendable key from the deposit ID
 */
function hashString(input: string): Buffer {
  return crypto.createHash('sha256').update(input, 'utf8').digest()
}

/**
 * Convert network string to bitcoinjs-lib network object
 */
export function getBitcoinNetwork(networkStr: string): bitcoin.Network {
  switch (networkStr.toLowerCase()) {
    case 'mainnet':
    case 'bitcoin':
      return bitcoin.networks.bitcoin
    case 'testnet':
      return bitcoin.networks.testnet
    case 'regtest':
      return bitcoin.networks.regtest
    default:
      throw new Error(`Unknown Bitcoin network: ${networkStr}`)
  }
}

/**
 * Derive the unspendable internal key from a deposit ID
 *
 * Creates a deterministic but unspendable key that serves as the Taproot internal key.
 * The key is "unspendable" because the base public key has no known private key.
 */
function deriveUnspendableKey(id: string, network: bitcoin.Network): Buffer {
  // Hash the deposit ID to get a deterministic 32-byte chain code
  const chainCode = hashString(id)

  // Parse the fixed unspendable public key (33 bytes, compressed format)
  const publicKey = Buffer.from(UNSPENDABLE_PUBLIC_KEY, 'hex')

  // Create the extended key with our custom chain code
  const extendedKey = bip32.fromPublicKey(publicKey, chainCode, network)

  // Derive at path m/0/0 using BIP32 non-hardened derivation
  const derived = extendedKey.derive(0).derive(0)

  // Return x-only public key by stripping the first byte (0x02 or 0x03 prefix)
  return derived.publicKey.slice(1)
}

/**
 * Calculate the Taproot address for a deposit account
 *
 * This is the core algorithm that independently calculates the Bitcoin address.
 * The address is a P2TR (Pay-to-Taproot) address with script-path spending enabled.
 */
export function calculateTaprootAddress(
  id: string,
  xOnlyPubkey: Buffer,
  network: bitcoin.Network,
): string {
  // Create the Taproot script for script-path spending
  // Format: <32-byte x-only pubkey> OP_CHECKSIG
  const script = bitcoin.script.compile([xOnlyPubkey, bitcoin.opcodes.OP_CHECKSIG])

  // Get the unspendable internal key (deterministic from deposit ID)
  const internalPubkey = deriveUnspendableKey(id, network)

  // Create the P2TR payment and encode as Bech32m address
  const payment = bitcoin.payments.p2tr({
    internalPubkey,
    scriptTree: {
      output: script,
    },
    network,
  })

  if (!payment.address) {
    throw new Error('Failed to generate address - invalid payment')
  }

  return payment.address
}

/**
 * Fetch address calculation data from the Attester API
 */
export async function fetchAddressCalculationData(
  attestorUrl: string,
): Promise<AttesterAddressResponse> {
  const url = buildUrl(attestorUrl, '/app/get-address-calculation-data')
  logger.debug(`Fetching address data from Attester API`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Attester API request failed: HTTP ${response.status}`)
  }

  const data = await response.json()

  // Basic validation of response structure
  if (!data || !Array.isArray(data.chains) || typeof data.bitcoin_network !== 'string') {
    throw new Error('Invalid Attester API response: missing required fields')
  }

  return data as AttesterAddressResponse
}

/**
 * Calculate and verify all vault addresses for a specific chain.
 * Returns an array of verified Bitcoin addresses that can be queried for UTXOs.
 */
export function calculateAndVerifyAddresses(
  chainGroup: ChainAddressGroup,
  network: bitcoin.Network,
): string[] {
  logger.debug(`Verifying ${chainGroup.addresses.length} addresses for chain ${chainGroup.chain}`)

  // Parse the xpub to get the threshold group's x-only public key
  const xpubDecoded = bip32.fromBase58(chainGroup.xpub, network)

  // Convert from 33-byte compressed key to 32-byte x-only key
  const xOnlyPubkey = xpubDecoded.publicKey.slice(1)

  const verifiedAddresses: string[] = []

  for (const addressInfo of chainGroup.addresses) {
    // Calculate the address independently from deposit ID and threshold pubkey
    const calculatedAddress = calculateTaprootAddress(addressInfo.id, xOnlyPubkey, network)

    // Verify our calculated address matches what the attestor reported
    if (calculatedAddress !== addressInfo.address_for_verification) {
      // Log full deposit ID for debugging
      logger.error(
        `Address mismatch for depositId=${addressInfo.id}: ` +
          `calculated=${calculatedAddress}, attestor=${addressInfo.address_for_verification}`,
      )
      throw new Error(
        `Address verification failed: depositId=${addressInfo.id}, ` +
          `calculated=${calculatedAddress}, expected=${addressInfo.address_for_verification}`,
      )
    }

    verifiedAddresses.push(calculatedAddress)
  }

  logger.info(`Verified ${verifiedAddresses.length} addresses for chain ${chainGroup.chain}`)
  return verifiedAddresses
}

/**
 * Fetch and calculate all vault addresses from the Attester API.
 * Queries the API, filters by chain name, calculates addresses trustlessly,
 * and verifies they match the attestor-provided addresses.
 */
export async function fetchAndCalculateVaultAddresses(
  attestorUrl: string,
  chainName: string,
): Promise<{ addresses: string[]; bitcoinNetwork: bitcoin.Network }> {
  logger.info(`Fetching vault addresses for chain=${chainName}`)

  // Fetch deposit account data from the attestor
  const data = await fetchAddressCalculationData(attestorUrl)
  const bitcoinNetwork = getBitcoinNetwork(data.bitcoin_network)

  logger.debug(`Attester response: network=${data.bitcoin_network}, chains=${data.chains.length}`)

  // Find the chain matching our configured chain name
  const chainGroup = data.chains.find((c) => c.chain.toLowerCase() === chainName.toLowerCase())

  if (!chainGroup) {
    const availableChains = data.chains.map((c) => c.chain).join(', ')
    throw new Error(`Chain "${chainName}" not found. Available: [${availableChains}]`)
  }

  // Calculate and verify all addresses
  const addresses = calculateAndVerifyAddresses(chainGroup, bitcoinNetwork)

  logger.info(
    `Fetched ${addresses.length} verified addresses for ${chainName} (${data.bitcoin_network})`,
  )

  return { addresses, bitcoinNetwork }
}
