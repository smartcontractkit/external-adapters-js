import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import schedule from 'node-schedule'

import { NavTransport } from '../../src/transport/nav'

LoggerFactoryProvider.set()

const defaultWindowParams = {
  fundId: 123,
  reportValue: 'net_asset_value' as const,
  startTime: '09:08:00',
  endTime: '12:00:00',
}

const setupTransport = async () => {
  const transport = new NavTransport()
  const mockDependencies = makeStub('dependencies', {
    responseCache: { write: jest.fn() },
    requester: { request: jest.fn() },
  } as any)
  const mockSettings = makeStub('settings', { NAV_CRON_INTERVAL_MIN: 1 } as any)
  await transport.initialize(mockDependencies, mockSettings, 'nav', 'test-transport')
  return { transport, mockDependencies }
}

describe('navTransport', () => {
  afterEach(() => {
    // node-schedule keeps a single global invocation queue, so cancel every job
    // to stop a timer left over from one test from blocking the next one
    Object.values(schedule.scheduledJobs).forEach((job) => job.cancel())
    jest.useRealTimers()
  })

  it('runScheduler should trigger periodically', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T10:00:00.000-05:00') }) // 9:08 <-> 12:00

    const { transport } = await setupTransport()
    const mockExecute = jest.spyOn(transport, 'execute').mockResolvedValue(undefined)

    await transport.registerRequest({
      requestContext: { data: defaultWindowParams },
    } as any)

    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(mockExecute).toHaveBeenCalledWith(defaultWindowParams)
    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(2)
  })

  it('runScheduler should not trigger outside hours', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T15:00:00.000-05:00') }) // 9:08 <-> 12:00

    const { transport } = await setupTransport()
    const mockExecute = jest.spyOn(transport, 'execute').mockResolvedValue(undefined)

    await transport.registerRequest({
      requestContext: { data: defaultWindowParams },
    } as any)

    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(0)
  })

  it('runScheduler should honor the startTime/endTime window of each request', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T15:00:00.000-05:00') })

    const { transport } = await setupTransport()
    const mockExecute = jest.spyOn(transport, 'execute').mockResolvedValue(undefined)

    const customWindowParams = {
      fundId: 456,
      reportValue: 'net_asset_value' as const,
      startTime: '14:00:00',
      endTime: '16:00:00',
    }
    await transport.registerRequest({
      requestContext: { data: defaultWindowParams },
    } as any)
    await transport.registerRequest({
      requestContext: { data: customWindowParams },
    } as any)

    jest.advanceTimersByTime(60 * 1000)
    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(mockExecute).toHaveBeenCalledWith(customWindowParams)
  })

  it('registerRequest should track the same fund separately per window', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T10:00:00.000-05:00') })

    const { transport } = await setupTransport()

    const otherWindowParams = { ...defaultWindowParams, startTime: '08:00:00', endTime: '13:00:00' }
    await transport.registerRequest({ requestContext: { data: defaultWindowParams } } as any)
    await transport.registerRequest({ requestContext: { data: defaultWindowParams } } as any)
    await transport.registerRequest({ requestContext: { data: otherWindowParams } } as any)

    expect([...transport.fundsMap.values()]).toEqual([defaultWindowParams, otherWindowParams])
  })

  it('execute should write the cache entry with the full request params', async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T15:00:00.000-05:00') }) // outside window, no retry

    const { transport, mockDependencies } = await setupTransport()
    jest.spyOn(transport, 'makeRequest').mockResolvedValue({
      data: [
        {
          fund_id: 123,
          net_asset_value_date: '12/29/2023',
          net_asset_value: '10.5',
          assets_under_management: '1000',
          outstanding_shares: '100',
          net_income_expenses: '0',
        },
      ],
    } as any)

    const params = { ...defaultWindowParams, startTime: '08:00:00', endTime: '13:00:00' }
    const response = await transport.execute(params)

    expect(response?.result).toBe(10.5)
    expect(mockDependencies.responseCache.write).toHaveBeenCalledWith('test-transport', [
      { params, response },
    ])
  })
})
