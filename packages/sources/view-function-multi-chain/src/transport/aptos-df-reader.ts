import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/aptos-df-reader'

type Feed = {
  benchmark: string
  config_id: string
  description: string // feed name
  observation_timestamp: string // seconds
  report: string
}

type FeedObj = {
  feed: Feed
  feed_id: string
}

type ErrorObj = {
  message: string
  error_code: string
  vm_error_code: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: { function: string; type_arguments: string[]; arguments: string[] }
    ResponseBody: FeedObj[][] | ErrorObj
  }
}
export const aptosTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const rpcUrl =
        param.networkType == 'testnet' ? config['APTOS_TESTNET_URL'] : config['APTOS_URL']
      return {
        params: [param],
        request: {
          baseURL: rpcUrl,
          url: '/view',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            function: param.signature,
            type_arguments: [],
            arguments: [],
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    // parse response from chainlink data feeds registry
    if (!(response.data instanceof Array)) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: JSON.stringify(response.data),
            statusCode: 502,
          },
        },
      ]
    }

    return params.map((param) => {
      const feedObjs = (response.data as FeedObj[][])[0]
      const f = feedObjs.find((f) => f.feed_id == param.feedId)
      if (!f) {
        return {
          params: param,
          response: {
            errorMessage: `No data found for feed_id ${param.feedId}`,
            statusCode: 502,
          },
        }
      }
      const result = f.feed.benchmark
      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
