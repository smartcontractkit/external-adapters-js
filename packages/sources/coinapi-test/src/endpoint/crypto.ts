import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, EndpointTypes } from '../crypto-utils'

interface ProviderResponseBody {
  asset_id_base: string
  rates: { time: string; asset_id_quote: string; rate: number }[]
}

interface ProviderRequestBody {
  filter_asset_id: string
  apikey: string
}

type HttpEndpointTypes = EndpointTypes & {
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody
  }
}

export const httpTransport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),

  parseResponse: (_, res) => {
    return res.data.rates.map((rate) => {
      return {
        params: { base: res.data.asset_id_base, quote: rate.asset_id_quote },
        response: {
          data: {
            result: rate.rate,
          },
          result: rate.rate,
        },
      }
    })
  },
})
