import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

import nock from 'nock'
import * as fixtures from './fixtures'

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

  it('returns open if tradinghours is open', async () => {
    const market = 'test-1'
    fixtures.mockTradinghoursOpen(market)

    const response = await waitForSuccessfulRequest({ market })
    await testAdapter.waitForCache()

    expect(response.json()).toEqual({
      data: {
        result: 2,
        source: 'TRADINGHOURS',
      },
      result: 2,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  it('returns closed if tradinghours is closed', async () => {
    const market = 'test-2'
    fixtures.mockTradinghoursClosed(market)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 1,
        source: 'TRADINGHOURS',
      },
      result: 1,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  it('returns ncfx if tradinghours is unknown', async () => {
    const market = 'test-3'
    fixtures.mockTradinghoursUnknown(market)
    fixtures.mockNCFXOpen(market)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 2,
        source: 'NCFX',
      },
      result: 2,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  it('returns ncfx if tradinghours is failing', async () => {
    const market = 'test-4'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXOpen(market)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 2,
        source: 'NCFX',
      },
      result: 2,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  it('returns unknown if tradinghours is failing and ncfx is failing', async () => {
    const market = 'test-5'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXError(market)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 0,
      },
      result: 0,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  it('returns unknown if tradinghours is failing and ncfx is unknown', async () => {
    const market = 'test-6'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXUnknown(market)

    const response = await waitForSuccessfulRequest({ market })
    expect(response.json()).toEqual({
      data: {
        result: 0,
      },
      result: 0,
      statusCode: 200,
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataRequestedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      },
    })
  })

  describe('for nyse market', () => {
    afterEach(async () => {
      nock.cleanAll()
      await testAdapter.mockCache?.cache.clear()
    })

    it('returns open if tradinghours is open', async () => {
      const market = 'nyse'
      fixtures.mockTradinghoursOpen(market)
      fixtures.mockFinnhubSecondaryClosed(market)
      const response = await waitForSuccessfulRequest({ market })
      expect(response.json()).toEqual({
        data: {
          result: 2,
          source: 'TRADINGHOURS',
        },
        result: 2,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: expect.any(Number),
        },
      })
    })

    it('returns open if tradinghours is unknown and finnhub is open', async () => {
      const market = 'nyse'
      fixtures.mockTradinghoursUnknown(market)
      fixtures.mockFinnhubSecondaryOpen(market)
      const response = await waitForSuccessfulRequest({ market })
      expect(response.json()).toEqual({
        data: {
          result: 2,
          source: 'FINNHUB_SECONDARY',
        },
        result: 2,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: expect.any(Number),
        },
      })
    })
  })

  describe('for multi market', () => {
    afterEach(async () => {
      nock.cleanAll()
      await testAdapter.mockCache?.cache.clear()
    })

    it('returns open if any 1 is open', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
      }

      fixtures.mockTradinghoursClosed('lse')
      fixtures.mockFinnhubSecondaryClosed('lse')
      fixtures.mockTradinghoursOpen('xetra')
      fixtures.mockFinnhubSecondaryClosed('xetra')
      fixtures.mockTradinghoursUnknown('euronext_milan')
      fixtures.mockFinnhubSecondaryClosed('euronext_milan')

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 2,
        },
        result: 2,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: expect.any(Number),
        },
      })
    })

    it('returns unknown if none open and at least 1 unknown', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
      }

      fixtures.mockTradinghoursClosed('lse')
      fixtures.mockFinnhubSecondaryClosed('lse')
      fixtures.mockTradinghoursUnknown('xetra')
      fixtures.mockFinnhubSecondaryUnknown('xetra')
      fixtures.mockTradinghoursClosed('euronext_milan')
      fixtures.mockFinnhubSecondaryClosed('euronext_milan')

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 0,
        },
        result: 0,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: expect.any(Number),
        },
      })
    })

    it('returns closed if all closed', async () => {
      const data = {
        endpoint: 'multi-market-status',
        market: 'lse,xetra,euronext_milan',
      }

      for (const market of data.market.split(',')) {
        fixtures.mockTradinghoursClosed(market)
        fixtures.mockFinnhubSecondaryClosed(market)
      }

      const response = await waitForSuccessfulRequest(data)
      expect(response.json()).toEqual({
        data: {
          result: 1,
        },
        result: 1,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
          providerIndicatedTimeUnixMs: expect.any(Number),
        },
      })
    })
  })
})
