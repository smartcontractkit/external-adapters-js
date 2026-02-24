import { useFakeTimers } from 'sinon'
import * as evm from '../../src/evm'

describe('evm utils', () => {
  describe('isPastBlock', () => {
    it('returns true when block equals lastSeenBlockNumber', () => {
      expect(evm.isPastBlock(100, 100)).toBe(true)
    })

    it('returns true when block is less than lastSeenBlockNumber', () => {
      expect(evm.isPastBlock(99, 100)).toBe(true)
    })

    it('returns false when block is greater than lastSeenBlockNumber', () => {
      expect(evm.isPastBlock(101, 100)).toBe(false)
    })

    it('handles zero values', () => {
      expect(evm.isPastBlock(0, 0)).toBe(true)
      expect(evm.isPastBlock(0, 1)).toBe(true)
      expect(evm.isPastBlock(1, 0)).toBe(false)
    })
  })

  describe('isValidBlock', () => {
    it('returns true when block difference is within deltaBlocks', () => {
      expect(evm.isValidBlock(95, 100, 5)).toBe(true)
    })

    it('returns true when block difference equals deltaBlocks', () => {
      expect(evm.isValidBlock(95, 100, 5)).toBe(true)
    })

    it('returns false when block difference exceeds deltaBlocks', () => {
      expect(evm.isValidBlock(94, 100, 5)).toBe(false)
    })

    it('returns true when current block is ahead of lastSeen', () => {
      expect(evm.isValidBlock(105, 100, 5)).toBe(true)
    })

    it('handles deltaBlocks of zero', () => {
      expect(evm.isValidBlock(100, 100, 0)).toBe(true)
      expect(evm.isValidBlock(99, 100, 0)).toBe(false)
    })
  })

  describe('isStaleBlock', () => {
    let clock: ReturnType<typeof useFakeTimers>

    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('returns false when block is not past lastSeenBlockNumber', () => {
      clock.tick(10000)
      expect(evm.isStaleBlock(101, 100, 0, 5000)).toBe(false)
    })

    it('returns false when time elapsed is less than delta', () => {
      clock.tick(4000)
      expect(evm.isStaleBlock(100, 100, 0, 5000)).toBe(false)
    })

    it('returns true when block is past and time elapsed exceeds delta', () => {
      clock.tick(6000)
      expect(evm.isStaleBlock(100, 100, 0, 5000)).toBe(true)
    })

    it('returns true when time elapsed equals delta exactly', () => {
      clock.tick(5000)
      expect(evm.isStaleBlock(99, 100, 0, 5000)).toBe(true)
    })

    it('handles timestamp in the past relative to current time', () => {
      clock.tick(10000)
      const pastTimestamp = 5000
      expect(evm.isStaleBlock(99, 100, pastTimestamp, 3000)).toBe(true)
    })
  })

  describe('parseHexBlockNumber', () => {
    it('parses hex string to number', () => {
      expect(evm.parseHexBlockNumber('0x1')).toBe(1)
      expect(evm.parseHexBlockNumber('0xa')).toBe(10)
      expect(evm.parseHexBlockNumber('0x10')).toBe(16)
      expect(evm.parseHexBlockNumber('0xff')).toBe(255)
    })

    it('parses large hex block numbers', () => {
      expect(evm.parseHexBlockNumber('0x100000')).toBe(1048576)
      expect(evm.parseHexBlockNumber('0xffffff')).toBe(16777215)
    })

    it('parses decimal numbers', () => {
      expect(evm.parseHexBlockNumber(100)).toBe(100)
    })

    it('throws error for empty string', () => {
      expect(() => evm.parseHexBlockNumber('')).toThrow('Block number is empty or undefined')
    })

    it('throws error for zero value that is falsy', () => {
      expect(() => evm.parseHexBlockNumber(0)).toThrow('Block number is empty or undefined')
    })
  })
})
