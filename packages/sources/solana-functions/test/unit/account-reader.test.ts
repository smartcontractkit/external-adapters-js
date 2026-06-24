import type { Idl } from '@coral-xyz/anchor'
import type { Address } from '@solana/addresses'
import type { Rpc, SolanaRpcApi } from '@solana/rpc'
import { SolanaAccountReader } from '../../src/shared/account-reader'

// Mocks
jest.mock('@coral-xyz/anchor', () => {
  const decodeMock = jest.fn()
  const BorshCoder = jest.fn().mockImplementation(() => ({
    accounts: { decode: decodeMock },
  }))
  return { BorshCoder }
})

jest.mock('@solana/addresses', () => ({
  getProgramDerivedAddress: jest.fn(),
}))

// Helpers to access mocks with types
const { BorshCoder } = jest.requireMock('@coral-xyz/anchor') as {
  BorshCoder: jest.Mock
}
const { getProgramDerivedAddress } = jest.requireMock('@solana/addresses') as {
  getProgramDerivedAddress: jest.Mock
}

describe('SolanaAccountReader', () => {
  const accountName = 'MyAccount'
  const fakeIdl = {} as unknown as Idl
  const address = 'ADDR11111111111111111111111111111111111111111' as unknown as Address

  // Fresh mocks per test
  let rpc: Rpc<SolanaRpcApi>
  let getAccountInfoMock: jest.Mock
  let sendMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    sendMock = jest.fn()
    getAccountInfoMock = jest.fn().mockReturnValue({ send: sendMock })
    rpc = { getAccountInfo: getAccountInfoMock } as unknown as Rpc<SolanaRpcApi>
  })

  describe('fetchAccountInformation', () => {
    it('requests base64-encoded account data, decodes via BorshCoder, and returns result', async () => {
      // Prepare base64 payload
      const raw = Buffer.from('foobar', 'utf8')
      const base64 = raw.toString('base64')

      // @solana/rpc shape: { value: { data: [base64, 'base64'] } }
      sendMock.mockResolvedValue({ value: { data: [base64, 'base64'] } })

      // Make BorshCoder.accounts.decode return a sentinel
      const decoded = { ok: true, kind: 'MyAccount' }
      ;(BorshCoder as jest.Mock).mockImplementation(() => ({
        accounts: { decode: jest.fn().mockReturnValue(decoded) },
      }))

      const reader = new SolanaAccountReader()
      const result = await reader.fetchAccountInformation(rpc, address, accountName, fakeIdl)

      // Correct RPC call
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
      expect(getAccountInfoMock).toHaveBeenCalledWith(address, { encoding: 'base64' })
      expect(sendMock).toHaveBeenCalledTimes(1)

      // BorshCoder constructed with the given IDL
      expect(BorshCoder).toHaveBeenCalledTimes(1)
      expect(BorshCoder).toHaveBeenCalledWith(fakeIdl)

      // Decode was invoked with accountName and the decoded Buffer
      const lastInstance = (BorshCoder as jest.Mock).mock.results[0].value
      expect(lastInstance.accounts.decode).toHaveBeenCalledTimes(1)
      const [passedName, passedBuffer] = lastInstance.accounts.decode.mock.calls[0]
      expect(passedName).toBe(accountName)
      expect(Buffer.isBuffer(passedBuffer)).toBe(true)
      expect((passedBuffer as Buffer).toString('utf8')).toBe('foobar')

      // Returned value is what decode produced
      expect(result).toBe(decoded)
    })

    it('throws when account is missing (value is null)', async () => {
      sendMock.mockResolvedValue({ value: null })

      const reader = new SolanaAccountReader()
      await expect(
        reader.fetchAccountInformation(rpc, address, accountName, fakeIdl),
      ).rejects.toThrow(`Account ${accountName} not found at ${address}`)
    })

    it('throws when account is missing (data[0] is null)', async () => {
      sendMock.mockResolvedValue({ value: { data: [null, 'base64'] } })

      const reader = new SolanaAccountReader()
      await expect(
        reader.fetchAccountInformation(rpc, address, accountName, fakeIdl),
      ).rejects.toThrow(`Account ${accountName} not found at ${address}`)
    })
  })

  describe('fetchAccountInformationByAddressAndSeeds', () => {
    it('derives PDA and delegates to fetchAccountInformation', async () => {
      const programAddress = 'PROG11111111111111111111111111111111111111111' as unknown as Address
      const seeds = [Buffer.from('seed1'), Buffer.from('seed2')]
      const derivedPda = 'PDA11111111111111111111111111111111111111111' as unknown as Address

      getProgramDerivedAddress.mockResolvedValue([derivedPda, 253])

      // Spy on the inner method to ensure delegation with the derived PDA
      const reader = new SolanaAccountReader()
      const innerSpy = jest
        .spyOn(reader, 'fetchAccountInformation')
        .mockResolvedValue({ delegated: true } as any)

      const result = await reader.fetchAccountInformationByAddressAndSeeds(
        rpc,
        programAddress,
        seeds,
        accountName,
        fakeIdl,
      )

      // Correct PDA derivation call
      expect(getProgramDerivedAddress).toHaveBeenCalledTimes(1)
      expect(getProgramDerivedAddress).toHaveBeenCalledWith({
        programAddress,
        seeds,
      })

      // Delegation with derived PDA
      expect(innerSpy).toHaveBeenCalledTimes(1)
      expect(innerSpy).toHaveBeenCalledWith(rpc, derivedPda, accountName, fakeIdl)

      expect(result).toEqual({ delegated: true })
    })
  })
})
