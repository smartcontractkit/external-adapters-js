import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'

import { NavTransport } from '../../src/transport/nav'

LoggerFactoryProvider.set()

describe('navTransport', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('runScheduler should trigger periodically', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T10:00:00.000-05:00') }) // 9:08 <-> 12:00

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

  it('runScheduler should not trigger outside hours', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T15:00:00.000-05:00') }) // 9:08 <-> 12:00

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
    expect(mockExecute).toHaveBeenCalledTimes(0)
  })
})
