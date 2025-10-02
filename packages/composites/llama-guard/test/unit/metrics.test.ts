import { emitMetric } from '../../src/transport/metrics'

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  ...jest.requireActual('@chainlink/external-adapter-framework/util'),
  makeLogger: jest.fn(() => ({ warn: jest.fn() })),
}))

describe('metrics.ts', () => {
  describe('emitMetric', () => {
    const mockResponse = {
      data: {
        rawNav: '1',
        adjustedNav: '2',
        riskFlag: false,
        breachDirection: 'lower',
        isBounded: false,
        decimals: 3,
        bases: {
          lookback: { nav: '4', ts: 5 },
          previous: { nav: '6', ts: 7 },
        },
      },
      statusCode: 200,
      result: '8',
      timestamps: {
        providerDataRequestedUnixMs: 9,
        providerDataReceivedUnixMs: 10,
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    it('should emit when breached', async () => {
      const mockRequester = {
        request: jest.fn().mockResolvedValue({} as any),
      } as any

      await emitMetric('endpoint', '0x0', mockResponse, mockRequester)

      expect(mockRequester.request).toHaveBeenCalledWith(expect.any(String), {
        baseURL: 'endpoint',
        method: 'POST',
        data: {
          riskFlag: false,
          breachDirection: 'lower',
          isBounded: false,
          rawNav: '1',
          adjustedNav: '2',
          asset_address: '0x0',
          timestamp: 10,
        },
      })
    })

    it('should skip emission when missing endpoint', async () => {
      const mockRequester = {
        request: jest.fn().mockResolvedValue({} as any),
      } as any

      await emitMetric('', '0x0', mockResponse, mockRequester)

      expect(mockRequester.request).toHaveBeenCalledTimes(0)
    })

    it('should skip emission when response is bounded', async () => {
      const mockRequester = {
        request: jest.fn().mockResolvedValue({} as any),
      } as any

      const boundedResponse = {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          isBounded: true,
        },
      }
      await emitMetric('endpoint', '0x0', boundedResponse, mockRequester)

      expect(mockRequester.request).toHaveBeenCalledTimes(0)
    })

    it('should not throw exception', async () => {
      const mockRequester = {
        request: jest.fn().mockRejectedValueOnce({}),
      } as any

      await emitMetric('endpoint', '0x0', mockResponse, mockRequester)
    })
  })
})
