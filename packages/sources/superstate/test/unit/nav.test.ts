import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'

jest.mock('../../src/transport/utils', () => ({
  ...jest.requireActual('../../src/transport/utils'),
  isInTimeRange: jest.fn(() => true),
}))

import { NavTransport } from '../../src/transport/nav'

LoggerFactoryProvider.set()

describe('navTransport', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('runScheduler should trigger periodically', async () => {
    const transport = new NavTransport()

    const mockExecute = jest.spyOn(transport, 'execute').mockResolvedValue(undefined)

    const mockDependencies = makeStub('dependencies', {
      responseCache: { write: jest.fn() },
      requester: { request: jest.fn() },
    } as any)

    const mockSettings = makeStub('settings', { NAV_CRON_INTERVAL_MIN: 1 } as any)

    await transport.initialize(mockDependencies, mockSettings, 'nav', 'test-transport')

    await transport.registerRequest({
      requestContext: { data: { fundId: 123, reportValue: 'nav' } },
    } as any)

    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(2)
  })
})
