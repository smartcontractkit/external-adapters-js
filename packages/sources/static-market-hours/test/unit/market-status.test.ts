import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/market-status'
import { CustomTransport, CustomTransportTypes } from '../../src/transport/market-status'

describe('CustomTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'market-status'

  const timezone = 'America/New_York'

  const adapterSettings = makeStub('adapterSettings', {
    MARKET_REGULAR_SCHEDULE: {
      get() {
        return JSON.stringify({
          timezone,
          lastValidDate: '2027-01-01',
          defaultStatus: 'CLOSED',
          weekly: [
            {
              status: 'OPEN',
              when: [
                {
                  days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                  times: [
                    {
                      start: '09:30:00',
                      end: '16:00:00',
                    },
                  ],
                },
              ],
            },
          ],
          exceptions: [],
        })
      },
    },
    MARKET_24_5_SCHEDULE: {
      get() {
        return JSON.stringify({
          timezone,
          lastValidDate: '2027-01-01',
          defaultStatus: 'WEEKEND',
          weekly: [
            {
              status: 'REGULAR',
              when: [
                {
                  days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                  times: [
                    {
                      start: '09:30:00',
                      end: '16:00:00',
                    },
                  ],
                },
              ],
            },
          ],
          exceptions: [],
        })
      },
    },
  } as unknown as BaseEndpointTypes['Settings'])

  const dependencies = makeStub(
    'dependencies',
    {} as unknown as TransportDependencies<CustomTransportTypes>,
  )

  let transport: CustomTransport

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T12:00:00Z').getTime())

    transport = new CustomTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('foregroundExecute', () => {
    it('should return regular market status', async () => {
      const params = {
        market: 'nymex',
        type: 'regular',
      }

      const request = makeStub('request', {
        requestContext: {
          data: params,
        },
      } as unknown as AdapterRequest<typeof inputParameters.validated>)

      const response = await transport.foregroundExecute(request, adapterSettings)

      expect(response).toEqual({
        data: {
          result: MarketStatus.CLOSED,
          statusString: 'CLOSED',
        },
        result: MarketStatus.CLOSED,
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return 24/5 market status', async () => {
      const params = {
        market: 'nyse',
        type: '24/5',
      }

      const request = makeStub('request', {
        requestContext: {
          data: params,
        },
      } as unknown as AdapterRequest<typeof inputParameters.validated>)

      const response = await transport.foregroundExecute(request, adapterSettings)

      expect(response).toEqual({
        data: {
          result: TwentyfourFiveMarketStatus.WEEKEND,
          statusString: 'WEEKEND',
        },
        result: TwentyfourFiveMarketStatus.WEEKEND,
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })
  })
})
