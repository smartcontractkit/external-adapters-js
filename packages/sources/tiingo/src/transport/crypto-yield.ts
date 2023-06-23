import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, ProviderResponseBody } from '../endpoint/crypto-yield'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'tiingo/crypto-yield/ticks',
          method: 'GET',
          params: {
            poolCodes: 'ethnetwork_eth',
            token: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      let resultVal: number | null = null
      if (param.aprTerm == '30Day' && 'apr30Day' in res.data[0]) {
        resultVal = res.data[0].apr30Day
      } else if (param.aprTerm == '90Day' && 'apr90Day' in res.data[0]) {
        resultVal = res.data[0].apr90Day
      }
      return {
        params: param,
        response: {
          result: resultVal,
          data: res.data[0] ?? null,
        },
      }
    })
  },
})
