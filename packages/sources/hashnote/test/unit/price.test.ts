import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AxiosResponse } from 'axios'
import { BaseEndpointTypes } from '../../src/endpoint/price'
import {
  PriceReport,
  RequestParams,
  ResponseSchema,
  parseResponse,
  prepareRequests,
} from '../../src/transport/price'

LoggerFactoryProvider.set()

describe('price transport', () => {
  const usycApiEndpoint = 'https://api.usyc.com'

  const config = makeStub('config', {
    USYC_API_ENDPOINT: usycApiEndpoint,
  } as unknown as BaseEndpointTypes['Settings'])

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()
  })

  describe('prepareRequests', () => {
    it('should prepare requests', async () => {
      const param = makeStub('param', {
        token: 'usyc',
      } as RequestParams)

      const rawRequests = prepareRequests([param], config)

      expect(rawRequests).toEqual([
        {
          params: [param],
          request: {
            baseURL: usycApiEndpoint,
          },
        },
      ])
    })

    it('should throw for unknown token', async () => {
      const param = makeStub('param', {
        token: 'abc',
      } as RequestParams)

      expect(() => prepareRequests([param], config)).toThrow(new Error('Unsupported token: abc'))
    })
  })

  describe('parseResponse', () => {
    const newestPrice = '1.090751641336855134'
    const newestReport: PriceReport = {
      roundId: '202',
      principal: '341191925.83',
      interest: '38508.39',
      balance: '341226583.381000919523923409960604',
      price: '1.090751641336855134',
      nextPrice: '1.090996801322275814',
      totalSupply: '312836186.029281',
      decimals: 18,
      fee: '3530.445294',
      timestamp: '1750243787',
      txhash: '0xa2eaae4f145907f55231c97a849b748ae134aee40a82f73bfa274157d34b3845',
    }
    const olderReport: PriceReport = {
      roundId: '201',
      principal: '343449161.26',
      interest: '38769.6',
      balance: '343484053.900000778240634998242329',
      price: '1.090640856098722279',
      nextPrice: '1.090763566942135103',
      totalSupply: '314937820.254286',
      decimals: 18,
      fee: '3554.754049',
      timestamp: '1750155971',
      txhash: '0xa7d8ddccd5e1bacba7b1e59c9411e8acd59353510246b023c3f9637e5398d08f',
    }

    it('should return response with price', async () => {
      const param = makeStub('param', {
        token: 'usyc',
      } as RequestParams)

      const response = makeStub('response', {
        data: {
          entity: 'usyc_price_report',
          data: [newestReport],
        },
      } as AxiosResponse<ResponseSchema>)

      const parsedResponse = parseResponse([param], response)

      expect(parsedResponse).toEqual([
        {
          params: { token: 'usyc' },
          response: { data: { result: newestPrice }, result: newestPrice },
        },
      ])
    })

    it('should return the latest price if it comes first', async () => {
      const param = makeStub('param', {
        token: 'usyc',
      } as RequestParams)

      const response = makeStub('response', {
        data: {
          entity: 'usyc_price_report',
          data: [newestReport, olderReport],
        },
      } as AxiosResponse<ResponseSchema>)

      const parsedResponse = parseResponse([param], response)

      expect(parsedResponse).toEqual([
        {
          params: { token: 'usyc' },
          response: { data: { result: newestPrice }, result: newestPrice },
        },
      ])
    })

    it('should return the latest price if it comes last', async () => {
      const param = makeStub('param', {
        token: 'usyc',
      } as RequestParams)

      const response = makeStub('response', {
        data: {
          entity: 'usyc_price_report',
          data: [olderReport, newestReport],
        },
      } as AxiosResponse<ResponseSchema>)

      const parsedResponse = parseResponse([param], response)

      expect(parsedResponse).toEqual([
        {
          params: { token: 'usyc' },
          response: { data: { result: newestPrice }, result: newestPrice },
        },
      ])
    })
  })
})
