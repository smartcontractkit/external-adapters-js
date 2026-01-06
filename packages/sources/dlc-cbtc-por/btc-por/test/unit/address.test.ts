/**
 * Unit tests for the Bitcoin address calculation logic.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import BIP32Factory from 'bip32'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import {
  calculateAndVerifyAddresses,
  calculateTaprootAddress,
  getBitcoinNetwork,
} from '../../src/lib/address'
import { ChainAddressGroup } from '../../src/lib/types'

const bip32 = BIP32Factory(ecc)

describe('Address Calculation Logic', () => {
  beforeAll(() => {
    // Set up the logger factory for testing
    LoggerFactoryProvider.set({
      child: () =>
        ({
          trace: jest.fn(),
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          fatal: jest.fn(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
    })
  })

  describe('getBitcoinNetwork', () => {
    it('should return bitcoin mainnet for "mainnet"', () => {
      const network = getBitcoinNetwork('mainnet')
      expect(network).toBe(bitcoin.networks.bitcoin)
    })

    it('should return bitcoin mainnet for "bitcoin"', () => {
      const network = getBitcoinNetwork('bitcoin')
      expect(network).toBe(bitcoin.networks.bitcoin)
    })

    it('should return testnet for "testnet"', () => {
      const network = getBitcoinNetwork('testnet')
      expect(network).toBe(bitcoin.networks.testnet)
    })

    it('should return regtest for "regtest"', () => {
      const network = getBitcoinNetwork('regtest')
      expect(network).toBe(bitcoin.networks.regtest)
    })

    it('should be case insensitive', () => {
      expect(getBitcoinNetwork('MAINNET')).toBe(bitcoin.networks.bitcoin)
      expect(getBitcoinNetwork('Testnet')).toBe(bitcoin.networks.testnet)
    })

    it('should throw for unknown network', () => {
      expect(() => getBitcoinNetwork('unknown')).toThrow('Unknown Bitcoin network: unknown')
    })
  })

  describe('calculateTaprootAddress', () => {
    it('should produce a valid P2TR address', () => {
      // Test with a sample x-only pubkey (32 bytes)
      const xOnlyPubkey = Buffer.from(
        '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'.slice(2),
        'hex',
      )
      const depositId = 'test-deposit-id-123'
      const network = bitcoin.networks.testnet

      const address = calculateTaprootAddress(depositId, xOnlyPubkey, network)

      // Should be a valid bech32m address starting with tb1p (testnet P2TR)
      expect(address).toMatch(/^tb1p[a-z0-9]+$/)
    })

    it('should produce different addresses for different deposit IDs', () => {
      const xOnlyPubkey = Buffer.from(
        '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'.slice(2),
        'hex',
      )
      const network = bitcoin.networks.testnet

      const address1 = calculateTaprootAddress('deposit-1', xOnlyPubkey, network)
      const address2 = calculateTaprootAddress('deposit-2', xOnlyPubkey, network)

      expect(address1).not.toBe(address2)
    })

    it('should produce mainnet addresses for mainnet network', () => {
      const xOnlyPubkey = Buffer.from(
        '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'.slice(2),
        'hex',
      )
      const network = bitcoin.networks.bitcoin

      const address = calculateTaprootAddress('test-id', xOnlyPubkey, network)

      // Should be a valid bech32m address starting with bc1p (mainnet P2TR)
      expect(address).toMatch(/^bc1p[a-z0-9]+$/)
    })
  })

  describe('calculateAndVerifyAddresses', () => {
    it('should throw when calculated address does not match verification', () => {
      // Generate a valid key for testing
      const testKey = bip32.fromSeed(Buffer.alloc(32, 1), bitcoin.networks.testnet)
      const xpub = testKey.neutered().toBase58()

      const chainGroup: ChainAddressGroup = {
        chain: 'testnet',
        xpub: xpub,
        addresses: [
          {
            id: 'test-deposit-id',
            address_for_verification: 'tb1pwrongaddress',
          },
        ],
      }
      const network = bitcoin.networks.testnet

      expect(() => calculateAndVerifyAddresses(chainGroup, network)).toThrow(
        /Address verification failed/,
      )
    })

    it('should return empty array for chain with no addresses', () => {
      // Generate a valid key for testing
      const testKey = bip32.fromSeed(Buffer.alloc(32, 1), bitcoin.networks.testnet)
      const xpub = testKey.neutered().toBase58()

      const chainGroup: ChainAddressGroup = {
        chain: 'testnet',
        xpub: xpub,
        addresses: [],
      }
      const network = bitcoin.networks.testnet

      const result = calculateAndVerifyAddresses(chainGroup, network)
      expect(result).toEqual([])
    })
  })
})
