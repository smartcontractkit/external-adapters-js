import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getAssets, getWallets } from '../../src/transport/wallet/wallet'

jest.mock('../../src/transport/requester', () => ({
  request: jest.fn(),
}))

import { request } from '../../src/transport/requester'

const mockRequest = request as jest.MockedFunction<typeof request>

describe('wallet.ts', () => {
  const mockRequester = {} as Requester

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWallets', () => {
    it('success', async () => {
      mockRequest.mockResolvedValue({
        data: [{ walletIdStr: 'wallet-1' }, { walletIdStr: 'wallet-2' }],
        extra: [],
      })

      const result = await getWallets('', '', '', mockRequester)

      expect(result).toEqual(['wallet-1', 'wallet-2'])
    })

    it('no response', async () => {
      mockRequest.mockResolvedValue(null as any)
      await expect(getWallets('', '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet list API returns empty wallets',
      )

      mockRequest.mockResolvedValue({
        data: [],
        extra: [],
      })
      await expect(getWallets('', '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet list API returns empty wallets',
      )
    })
  })

  describe('getAssets', () => {
    it('success', async () => {
      mockRequest.mockResolvedValue({
        data: [
          { coinSymbol: 'BTC', amount: '1.5' },
          { coinSymbol: 'ETH', amount: '10.0' },
          { coinSymbol: 'USDT', amount: '0' },
        ],
        extra: [],
      })

      const result = await getAssets('w1', '', '', '', mockRequester)

      expect(result).toEqual([
        { coin: 'BTC', amount: '1.5' },
        { coin: 'ETH', amount: '10.0' },
      ])
    })

    it('no response', async () => {
      mockRequest.mockResolvedValue({
        data: [],
        extra: [],
      })
      await expect(getAssets('', '', '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet asset API returns empty assets',
      )

      mockRequest.mockResolvedValue(null as any)
      await expect(getAssets('', '', '', '', mockRequester)).rejects.toThrow(
        'Ceffu wallet asset API returns empty assets',
      )
    })
  })
})
