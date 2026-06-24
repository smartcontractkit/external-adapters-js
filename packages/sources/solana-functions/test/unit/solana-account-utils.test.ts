import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import {
  assertDataLength,
  assertDiscriminator,
  assertOwnerProgram,
  fetchMultipleAccounts,
  getAccountDataBuffer,
} from '../../src/shared/solana-account-utils'

describe('solana-account-utils', () => {
  describe('getAccountDataBuffer', () => {
    it('should decode base64 account data', () => {
      const data = Buffer.from('hello').toString('base64')

      expect(getAccountDataBuffer({ data: [data, 'base64'] }, 'test account').toString()).toBe(
        'hello',
      )
    })

    it('should throw when account data is missing', () => {
      expect(() => getAccountDataBuffer(null, 'test account')).toThrow(
        'No account data found for test account',
      )
    })
  })

  describe('assertOwnerProgram', () => {
    it('should accept an expected owner', () => {
      expect(() =>
        assertOwnerProgram({ owner: 'owner-1' }, 'test account', ['owner-1'], 'test program'),
      ).not.toThrow()
    })

    it('should throw for an unexpected owner', () => {
      expect(() =>
        assertOwnerProgram({ owner: 'owner-2' }, 'test account', ['owner-1'], 'test program'),
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

  describe('fetchMultipleAccounts', () => {
    const sendMock = jest.fn()
    const getMultipleAccountsMock = jest.fn()
    const rpc = { getMultipleAccounts: getMultipleAccountsMock } as unknown as Rpc<SolanaRpcApi>

    beforeEach(() => {
      jest.resetAllMocks()
      getMultipleAccountsMock.mockReturnValue({ send: sendMock })
    })

    it('should fetch base64 accounts in one request', async () => {
      const accounts = [{ data: ['AA==', 'base64'], owner: 'owner' }]
      sendMock.mockResolvedValue({ value: accounts })

      await expect(fetchMultipleAccounts(rpc, ['address-1'])).resolves.toBe(accounts)
      expect(getMultipleAccountsMock).toHaveBeenCalledWith(['address-1'], { encoding: 'base64' })
    })

    it('should throw when response count does not match request count', async () => {
      sendMock.mockResolvedValue({ value: [] })

      await expect(fetchMultipleAccounts(rpc, ['address-1'])).rejects.toThrow(
        'Expected 1 account responses, received 0',
      )
    })
  })
})
