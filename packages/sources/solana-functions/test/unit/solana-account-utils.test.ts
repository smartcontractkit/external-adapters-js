import { address, getAddressEncoder } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import {
  CLOCK_SYSVAR_ADDRESS,
  assertAddressMatches,
  assertDataLength,
  assertDiscriminator,
  assertNameMatches,
  assertOwnerProgram,
  decodeClockUnixTimestamp,
  derivePda,
  fetchMultipleAccounts,
  getAccountDataBuffer,
  parseSolanaAddress,
  type AccountInfo,
} from '../../src/shared/solana-account-utils'

describe('solana-account-utils', () => {
  const systemProgramAddress = '11111111111111111111111111111111'

  const makeAccountInfo = (data: string, owner = systemProgramAddress) =>
    ({ data: [data, 'base64'], owner } as unknown as AccountInfo)

  describe('parseSolanaAddress', () => {
    it('should validate Solana addresses', () => {
      expect(parseSolanaAddress(systemProgramAddress, 'programAddress')).toBe(systemProgramAddress)
      expect(() => parseSolanaAddress('not-an-address', 'programAddress')).toThrow(
        'programAddress must be a valid Solana address',
      )
    })
  })

  describe('derivePda', () => {
    it('should derive PDAs with @solana/addresses', async () => {
      const addressEncoder = getAddressEncoder()
      const glamProtocolProgramAddress = 'GLAMpaME8wdTEzxtiYEAa5yD8fZbxZiz2hNtV58RZiEz'
      const glamStateAddress = '5E2scHi8LyZAqZeVHnXLeFhwoePxD2CTdSruWmjgVEoB'

      await expect(
        derivePda(glamProtocolProgramAddress, [
          'vault',
          addressEncoder.encode(address(glamStateAddress)),
        ]),
      ).resolves.toBe('GMwdh2jTdTrrhA7dMR7Cc2zC6gV38UePzAXeoFHrXnfH')
    })
  })

  describe('getAccountDataBuffer', () => {
    it('should decode base64 account data', () => {
      const data = Buffer.from('hello').toString('base64')

      expect(getAccountDataBuffer(makeAccountInfo(data), 'test account').toString()).toBe('hello')
    })

    it('should throw when account data is missing', () => {
      expect(() => getAccountDataBuffer(null, 'test account')).toThrow(
        'No account data found for test account',
      )
    })

    it('should throw when account data is not a base64 string', () => {
      const accountInfo = { data: [123, 'base64'], owner: systemProgramAddress }

      expect(() =>
        getAccountDataBuffer(accountInfo as unknown as AccountInfo, 'test account'),
      ).toThrow('No account data found for test account')
    })
  })

  describe('assertOwnerProgram', () => {
    it('should accept an expected owner', () => {
      expect(() =>
        assertOwnerProgram(
          makeAccountInfo('', 'owner-1'),
          'test account',
          ['owner-1'],
          'test program',
        ),
      ).not.toThrow()
    })

    it('should throw for an unexpected owner', () => {
      expect(() =>
        assertOwnerProgram(
          makeAccountInfo('', 'owner-2'),
          'test account',
          ['owner-1'],
          'test program',
        ),
      ).toThrow("Expected test account to be owned by test program [owner-1], found 'owner-2'")
    })
  })

  describe('assertDataLength', () => {
    it('should assert minimum data length', () => {
      expect(() => assertDataLength(Buffer.alloc(2), 'test account', 3)).toThrow(
        'Expected test account account data to be at least 3 bytes, found 2',
      )
    })
  })

  describe('generic assertions', () => {
    it('should assert matching names and addresses', () => {
      expect(() => assertNameMatches('strategy', 'strategy', 'Strategy')).not.toThrow()
      expect(() => assertNameMatches('other', 'strategy', 'Strategy')).toThrow(
        "Expected Strategy name to be 'strategy', found 'other'",
      )

      expect(() => assertAddressMatches('address-1', 'address-1', 'mint PDA')).not.toThrow()
      expect(() => assertAddressMatches('address-2', 'address-1', 'mint PDA')).toThrow(
        "Expected mint PDA to be 'address-1', found 'address-2'",
      )
    })
  })

  describe('assertDiscriminator', () => {
    it('should assert discriminator bytes', () => {
      expect(() =>
        assertDiscriminator(Buffer.from([1, 2]), 'test account', Buffer.from([1])),
      ).not.toThrow()
      expect(() =>
        assertDiscriminator(Buffer.from([1, 2]), 'test account', Buffer.from([2])),
      ).toThrow('Expected test account discriminator to be 02, found 01')
    })
  })

  describe('decodeClockUnixTimestamp', () => {
    it('should decode the Solana Clock sysvar timestamp', () => {
      const data = Buffer.alloc(40)
      data.writeBigInt64LE(1_781_704_234n, 32)

      expect(decodeClockUnixTimestamp(makeAccountInfo(data.toString('base64')))).toBe(
        1_781_704_234n,
      )
    })

    it('should reject missing Clock sysvar data', () => {
      expect(() => decodeClockUnixTimestamp(null)).toThrow(
        `No account data found for Clock sysvar '${CLOCK_SYSVAR_ADDRESS}'`,
      )
    })
  })

  describe('fetchMultipleAccounts', () => {
    const sendMock = jest.fn()
    const getMultipleAccountsMock = jest.fn()
    const rpc = { getMultipleAccounts: getMultipleAccountsMock } as unknown as Rpc<SolanaRpcApi>

    beforeEach(() => {
      jest.resetAllMocks()
      getMultipleAccountsMock.mockReturnValue({ send: sendMock })
    })

    it('should fetch base64 accounts in one request', async () => {
      const accounts = [makeAccountInfo('AA==')]
      sendMock.mockResolvedValue({ value: accounts })

      await expect(fetchMultipleAccounts(rpc, [systemProgramAddress])).resolves.toBe(accounts)
      expect(getMultipleAccountsMock).toHaveBeenCalledWith([systemProgramAddress], {
        encoding: 'base64',
      })
    })

    it('should throw when response count does not match request count', async () => {
      sendMock.mockResolvedValue({ value: [] })

      await expect(fetchMultipleAccounts(rpc, [systemProgramAddress])).rejects.toThrow(
        'Expected 1 account responses, received 0',
      )
    })
  })
})
