import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/aptos-df-reader'
import { doPrepareRequests, ErrorObj, RequestObj } from '../utils/aptos-common'

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

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: RequestObj
    ResponseBody: FeedObj[][] | ErrorObj
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params) => {
    return params.map((param) => {
      const request = doPrepareRequests(
        param.networkType,
        param.signature,
        param.type,
        param.arguments,
      )
      return {
        params: [param],
        ...request,
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
