import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import BIP32Factory from 'bip32'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import {
  calculateAndVerifyAddresses,
  calculateTaprootAddress,
  getBitcoinNetwork,
} from '../../src/lib/btc/address'
import { ChainAddressGroup } from '../../src/lib/btc/types'

const bip32 = BIP32Factory(ecc)

// Initialize logger for functions that use makeLogger
LoggerFactoryProvider.set()

describe('BTC Address Calculation', () => {
  describe('getBitcoinNetwork', () => {
    it('should return bitcoin mainnet for "mainnet"', () => {
      expect(getBitcoinNetwork('mainnet')).toBe(bitcoin.networks.bitcoin)
    })

    it('should return bitcoin mainnet for "bitcoin"', () => {
      expect(getBitcoinNetwork('bitcoin')).toBe(bitcoin.networks.bitcoin)
    })

    it('should return testnet for "testnet"', () => {
      expect(getBitcoinNetwork('testnet')).toBe(bitcoin.networks.testnet)
    })

    it('should return regtest for "regtest"', () => {
      expect(getBitcoinNetwork('regtest')).toBe(bitcoin.networks.regtest)
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
    const xOnlyPubkey = Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'.slice(2),
      'hex',
    )

    it('should produce a valid testnet P2TR address', () => {
      const address = calculateTaprootAddress(
        'test-deposit-id',
        xOnlyPubkey,
        bitcoin.networks.testnet,
      )
      expect(address).toMatch(/^tb1p[a-z0-9]+$/)
    })

    it('should produce a valid mainnet P2TR address', () => {
      const address = calculateTaprootAddress(
        'test-deposit-id',
        xOnlyPubkey,
        bitcoin.networks.bitcoin,
      )
      expect(address).toMatch(/^bc1p[a-z0-9]+$/)
    })

    it('should produce different addresses for different deposit IDs', () => {
      const address1 = calculateTaprootAddress('deposit-1', xOnlyPubkey, bitcoin.networks.testnet)
      const address2 = calculateTaprootAddress('deposit-2', xOnlyPubkey, bitcoin.networks.testnet)
      expect(address1).not.toBe(address2)
    })
  })

  describe('calculateAndVerifyAddresses', () => {
    it('should throw when calculated address does not match verification', () => {
      const testKey = bip32.fromSeed(Buffer.alloc(32, 1), bitcoin.networks.testnet)
      const chainGroup: ChainAddressGroup = {
        chain: 'testnet',
        xpub: testKey.neutered().toBase58(),
        addresses: [{ id: 'test-deposit-id', address_for_verification: 'tb1pwrongaddress' }],
      }

      expect(() => calculateAndVerifyAddresses(chainGroup, bitcoin.networks.testnet)).toThrow(
        /Address verification failed/,
      )
    })

    it('should return empty array for chain with no addresses', () => {
      const testKey = bip32.fromSeed(Buffer.alloc(32, 1), bitcoin.networks.testnet)
      const chainGroup: ChainAddressGroup = {
        chain: 'testnet',
        xpub: testKey.neutered().toBase58(),
        addresses: [],
      }

      expect(calculateAndVerifyAddresses(chainGroup, bitcoin.networks.testnet)).toEqual([])
    })
  })
})
