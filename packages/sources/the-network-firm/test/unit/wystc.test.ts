import { HttpTransportConfig } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/transport/common'
import {
  HttpTransportTypes,
  parseResponse,
  prepareRequests,
  ResponseSchema,
} from '../../src/transport/wystc'

// Derived from framework type instead of using AxiosResponse<ResponseSchema>
// to avoid having to keep our axios dependency in sync with the framework's.
type Response = Parameters<HttpTransportConfig<HttpTransportTypes>['parseResponse']>[1]

LoggerFactoryProvider.set()

describe('wystc transport', () => {
  const param = makeStub('param', {} as BaseEndpointTypes['Parameters'])
  const settings = makeStub('settings', {} as BaseEndpointTypes['Settings'])

  describe('prepareRequests', () => {
    it('builds the snapshot request with the api key header', () => {
      const config = makeStub('config', {
        WYSTC_API_ENDPOINT: 'https://api.wystc.test',
        WYSTC_API_KEY: 'wystc-api-key',
      } as BaseEndpointTypes['Settings'])

      expect(prepareRequests([param], config)).toEqual({
        params: [param],
        request: {
          baseURL: 'https://api.wystc.test',
          url: '/v1/proof-of-reserves/wystc/snapshot',
          headers: {
            'x-api-key': 'wystc-api-key',
          },
        },
      })
    })
  })

  describe('parseResponse', () => {
    const makeResponse = (data: Partial<ResponseSchema>) =>
      makeStub('response', {
        data: {
          totalReserves: '1000000',
          totalSupply: '900000',
          ripcord: false,
          ripcordDetails: [],
          timestamp: '2025-07-03T00:01:57.131Z',
          ripcordTimestamp: null,
          ...data,
        },
      } as Response)

    it('maps a successful snapshot to a numeric result', () => {
      const [result] = parseResponse([param], makeResponse({}), settings)

      expect(result).toEqual({
        params: param,
        response: {
          result: 1000000,
          data: {
            result: 1000000,
            totalReserves: 1000000,
            totalSupply: 900000,
            ripcord: false,
            ripcordAsInt: 0,
            ripcordDetails: [],
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date('2025-07-03T00:01:57.131Z').getTime(),
          },
        },
      })
    })

    it('exposes a tripped ripcord as ripcordAsInt 1', () => {
      const [result] = parseResponse(
        [param],
        makeResponse({ ripcord: true, ripcordDetails: ['Integrations'] }),
        settings,
      )

      expect(result.response.data).toMatchObject({
        ripcord: true,
        ripcordAsInt: 1,
        ripcordDetails: ['Integrations'],
      })
    })

    it('returns a 502 error when totalReserves is not a number', () => {
      const [result] = parseResponse(
        [param],
        makeResponse({ totalReserves: 'not-a-number' }),
        settings,
      )

      expect(result.response).toEqual({
        errorMessage: 'Failed to parse totalReserves or totalSupply',
        statusCode: 502,
        timestamps: {
          providerIndicatedTimeUnixMs: new Date('2025-07-03T00:01:57.131Z').getTime(),
        },
      })
    })

    it('returns a 502 error when totalSupply is not a number', () => {
      const [result] = parseResponse([param], makeResponse({ totalSupply: 'oops' }), settings)

      expect(result.response).toMatchObject({
        errorMessage: 'Failed to parse totalReserves or totalSupply',
        statusCode: 502,
      })
    })
  })
})
