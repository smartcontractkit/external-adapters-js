import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { fetchFieldFromBufferLayoutStateAccount } from '../../src/shared/buffer-layout-accounts'
import * as sanctumInfinityPoolAccountData from '../fixtures/sanctum-infinity-pool-account-data-2025-10-07.json'
import * as sanctumInfinityTokenAccountData from '../fixtures/sanctum-infinity-token-account-data-2025-10-07.json'
import * as tokenAccountData from '../fixtures/token-account-data-2025-12-01.json'

describe('buffer-layout-accounts', () => {
  const sendMock = jest.fn()
  const getAccountInfoMock = jest.fn()
  const rpc = { getAccountInfo: getAccountInfoMock } as unknown as Rpc<SolanaRpcApi>

  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    getAccountInfoMock.mockReturnValue({ send: sendMock })
  })

  describe('fetchFieldFromBufferLayoutStateAccount', () => {
    it('should fetch and decode field from mint account', async () => {
      const response = makeStub('response', sanctumInfinityTokenAccountData.result)

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

      const poolTotalSolValue = await fetchFieldFromBufferLayoutStateAccount({
        stateAccountAddress,
        field: 'supply',
        rpc,
      })
      expect(poolTotalSolValue).toBe('1116792619507830')

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should fetch and decode field from token account', async () => {
      const response = makeStub('response', tokenAccountData.result)

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = 'FvkbfMm98jefJWrqkvXvsSZ9RFaRBae8k6c1jaYA5vY3'

      const amount = await fetchFieldFromBufferLayoutStateAccount({
        stateAccountAddress,
        field: 'amount',
        rpc,
      })
      expect(amount).toBe('34228590128')

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should fetch and decode field from sanctum state account', async () => {
      const response = makeStub('response', sanctumInfinityPoolAccountData.result)
      sendMock.mockResolvedValue(response)

      const stateAccountAddress = 'AYhux5gJzCoeoc1PoJ1VxwPDe22RwcvpHviLDD1oCGvW'

      const poolTotalSolValue = await fetchFieldFromBufferLayoutStateAccount({
        stateAccountAddress,
        field: 'total_sol_value',
        rpc,
      })
      expect(poolTotalSolValue).toBe('1526932937260359')

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should throw for unknown field', async () => {
      const response = makeStub('response', sanctumInfinityTokenAccountData.result)

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

      await expect(() =>
        fetchFieldFromBufferLayoutStateAccount({
          stateAccountAddress,
          field: 'unknown_field',
          rpc,
        }),
      ).rejects.toThrow(
        "No field 'unknown_field' in layout for program with address 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'. Available fields are: mintAuthorityOption, mintAuthority, supply, decimals, isInitialized, freezeAuthorityOption, freezeAuthority",
      )

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should throw for unsupported Token Program account size', async () => {
      const response = makeStub('response', {
        value: {
          data: [
            'dGVzdA==', // Just some test data
            'base64',
          ],
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      })

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

      await expect(() =>
        fetchFieldFromBufferLayoutStateAccount({
          stateAccountAddress,
          field: 'amount',
          rpc,
        }),
      ).rejects.toThrow(
        'Unsupported Token Program account size: 4 bytes. Expected 82 (Mint) or 165 (Token Account)',
      )

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should throw for unknown program', async () => {
      const response = makeStub('response', {
        value: {
          data: sanctumInfinityTokenAccountData.result.value.data,
          owner: 'unknown-program-address',
        },
      })

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

      await expect(() =>
        fetchFieldFromBufferLayoutStateAccount({
          stateAccountAddress,
          field: 'unknown_field',
          rpc,
        }),
      ).rejects.toThrow("No layout known for program address 'unknown-program-address'")

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })

    it('should throw for absert account owner', async () => {
      const response = makeStub('response', {
        value: {
          data: sanctumInfinityTokenAccountData.result.value.data,
          owner: undefined,
        },
      })

      sendMock.mockResolvedValue(response)

      const stateAccountAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

      await expect(() =>
        fetchFieldFromBufferLayoutStateAccount({
          stateAccountAddress,
          field: 'unknown_field',
          rpc,
        }),
      ).rejects.toThrow(`No program address found for state account '${stateAccountAddress}'`)

      expect(getAccountInfoMock).toHaveBeenCalledWith(stateAccountAddress, { encoding: 'base64' })
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1)
    })
  })
})
