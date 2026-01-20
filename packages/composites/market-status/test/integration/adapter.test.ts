import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

import nock from 'nock'
import { mockClosed, mockError, mockOpen, mockUnknown } from './fixtures'

describe('execute', () => {
  let clock: FakeTimers.InstalledClock
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.NCFX_ADAPTER_URL = 'https://ncfx-adapter.com'
    process.env.TRADINGHOURS_ADAPTER_URL = 'https://tradinghours-adapter.com'
    process.env.FINNHUB_SECONDARY_ADAPTER_URL = 'https://finnhub-secondary-adapter.com'

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    clock = FakeTimers.install()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock,
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    clock.uninstall()
    await testAdapter.api.close()
  })

  const waitForSuccessfulRequest = async (data: object) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await testAdapter.request(data)
      if (response.statusCode === 200) {
        return response
      }
      await clock.nextAsync()
    }
  }

  const timestamps = {
    providerDataReceivedUnixMs: expect.any(Number),
    providerDataRequestedUnixMs: expect.any(Number),
    providerIndicatedTimeUnixMs: expect.any(Number),
  }

  it('returns open if tradinghours is open', async () => {
    const market = 'test-1'
    mockOpen(market, process.env.TRADINGHOURS_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    await testAdapter.waitForCache()

    expect(response.json()).toEqual({
      data: {
        result: 2,
        statusString: 'OPEN',
        source: 'TRADINGHOURS',
      },
      result: 2,
      statusCode: 200,
      timestamps,
    })
  })

  it('returns closed if tradinghours is closed', async () => {
    const market = 'test-2'
    mockClosed(market, process.env.TRADINGHOURS_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 1,
        statusString: 'CLOSED',
        source: 'TRADINGHOURS',
      },
      result: 1,
      statusCode: 200,
      timestamps,
    })
  })

  it('returns ncfx if tradinghours is unknown', async () => {
    const market = 'test-3'
    mockUnknown(market, process.env.TRADINGHOURS_ADAPTER_URL)
    mockOpen(market, process.env.NCFX_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 2,
        statusString: 'OPEN',
        source: 'NCFX',
      },
      result: 2,
      statusCode: 200,
      timestamps,
    })
  })

  it('returns ncfx if tradinghours is failing', async () => {
    const market = 'test-4'
    mockError(market, process.env.TRADINGHOURS_ADAPTER_URL)
    mockOpen(market, process.env.NCFX_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 2,
        statusString: 'OPEN',
        source: 'NCFX',
      },
      result: 2,
      statusCode: 200,
      timestamps,
    })
  })

  it('returns unknown if tradinghours is failing and ncfx is failing', async () => {
    const market = 'test-5'
    mockError(market, process.env.TRADINGHOURS_ADAPTER_URL)
    mockError(market, process.env.NCFX_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 0,
        statusString: 'UNKNOWN',
      },
      result: 0,
      statusCode: 200,
      timestamps,
    })
  })

  it('returns unknown if tradinghours is failing and ncfx is unknown', async () => {
    const market = 'test-6'
    mockError(market, process.env.TRADINGHOURS_ADAPTER_URL)
    mockUnknown(market, process.env.NCFX_ADAPTER_URL)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 0,
        statusString: 'UNKNOWN',
      },
      result: 0,
      statusCode: 200,
      timestamps,
    })
  })

  describe('24/5', () => {
    it('returns primary', async () => {
      const market = '24/5-test-1'
      mockOpen(market, process.env.TRADINGHOURS_ADAPTER_URL, '24/5', '220-320:UTC')

      const response = await waitForSuccessfulRequest({
        market,
        type: '24/5',
        weekend: '220-320:UTC',
      })
      await testAdapter.waitForCache()

      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'OPEN',
          source: 'TRADINGHOURS',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })
    it('returns secondary if primary is unknown', async () => {
      const market = '24/5-test-2'
      mockUnknown(market, process.env.TRADINGHOURS_ADAPTER_URL, '24/5', '220-320:UTC')
      clock.setSystemTime(new Date('2026-01-15T17:00:00Z')) // 12:00 PM ET = 17:00 UTC

      const response = await waitForSuccessfulRequest({
        market,
        type: '24/5',
        weekend: '220-320:UTC',
      })
      await testAdapter.waitForCache()

      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'REGULAR',
          source: 'HARD_CODE_245',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })
    it('returns secondary if primary is down', async () => {
      const market = '24/5-test-3'
      mockError(market, process.env.TRADINGHOURS_ADAPTER_URL, '24/5', '220-320:UTC')
      clock.setSystemTime(new Date('2026-01-15T17:00:00Z')) // 12:00 PM ET = 17:00 UTC

      const response = await waitForSuccessfulRequest({
        market,
        type: '24/5',
        weekend: '220-320:UTC',
      })
      await testAdapter.waitForCache()

      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'REGULAR',
          source: 'HARD_CODE_245',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })
  })

  describe('for nyse market', () => {
    afterEach(async () => {
      nock.cleanAll()
      await testAdapter.mockCache?.cache.clear()
    })

    it('returns open if tradinghours is open', async () => {
      const market = 'nyse'
      mockOpen(market, process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed(market, process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest({ market })

      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'OPEN',
          source: 'TRADINGHOURS',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })

    it('returns open if tradinghours is unknown and finnhub is open', async () => {
      const market = 'nyse'
      mockUnknown(market, process.env.TRADINGHOURS_ADAPTER_URL)
      mockOpen(market, process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest({ market })

      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'OPEN',
          source: 'FINNHUB_SECONDARY',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })
  })

  describe('for multi market', () => {
    afterEach(async () => {
      nock.cleanAll()
      await testAdapter.mockCache?.cache.clear()
    })

    it('returns error if type is 24/5', async () => {
      const response = await testAdapter.request({
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'any',
        type: '24/5',
      })

      expect(response.json()).toEqual({
        error: {
          errorResponse: '[Param: type] must be regular for multi-market-status endpoint',
          message: 'There was an unexpected error in the adapter.',
          name: 'AdapterError',
        },
        status: 'errored',
        statusCode: 400,
      })
    })

    it('returns open if any 1 is open with openMode: any', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'any',
      }

      mockClosed('lse', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('lse', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockOpen('xetra', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('xetra', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockUnknown('euronext_milan', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'OPEN',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })

    it('returns unknown if none open and at least 1 unknown', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'any',
        closedMode: 'all',
      }

      mockClosed('lse', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('lse', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockUnknown('xetra', process.env.TRADINGHOURS_ADAPTER_URL)
      mockUnknown('xetra', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 0,
          statusString: 'UNKNOWN',
        },
        result: 0,
        statusCode: 200,
        timestamps,
      })
    })

    it('returns closed if all closed with closedMode: all', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'any',
        closedMode: 'all',
      }

      for (const market of data.market.split(',')) {
        mockClosed(market, process.env.TRADINGHOURS_ADAPTER_URL)
        mockClosed(market, process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      }

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 1,
          statusString: 'CLOSED',
        },
        result: 1,
        statusCode: 200,
        timestamps,
      })
    })

    it('returns closed if any closed with closedMode: any and not satisfying openMode', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'all',
        closedMode: 'any',
      }

      mockClosed('lse', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('lse', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockOpen('xetra', process.env.TRADINGHOURS_ADAPTER_URL)
      mockOpen('xetra', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.TRADINGHOURS_ADAPTER_URL)
      mockUnknown('euronext_milan', process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 1,
          statusString: 'CLOSED',
        },
        result: 1,
        statusCode: 200,
        timestamps,
      })
    })

    it('returns unknown if mixture with both modes: all', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'all',
        closedMode: 'all',
      }

      mockClosed('lse', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('lse', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockOpen('xetra', process.env.TRADINGHOURS_ADAPTER_URL)
      mockOpen('xetra', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.TRADINGHOURS_ADAPTER_URL)
      mockUnknown('euronext_milan', process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 0,
          statusString: 'UNKNOWN',
        },
        result: 0,
        statusCode: 200,
        timestamps,
      })
    })

    it('processes openMode before closedMode with both modes: any', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
        openMode: 'any',
        closedMode: 'any',
      }

      mockClosed('lse', process.env.TRADINGHOURS_ADAPTER_URL)
      mockClosed('lse', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockOpen('xetra', process.env.TRADINGHOURS_ADAPTER_URL)
      mockOpen('xetra', process.env.FINNHUB_SECONDARY_ADAPTER_URL)
      mockClosed('euronext_milan', process.env.TRADINGHOURS_ADAPTER_URL)
      mockUnknown('euronext_milan', process.env.FINNHUB_SECONDARY_ADAPTER_URL)

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 2,
          statusString: 'OPEN',
        },
        result: 2,
        statusCode: 200,
        timestamps,
      })
    })
  })
})
