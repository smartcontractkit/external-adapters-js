import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, inputParameters } from '../endpoint/twap'

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: TypeFromDefinition<typeof inputParameters.definition>
    ResponseBody: BaseEndpointTypes['Response']['Data']
  }
}

export const twapTransportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const fullUrl = `${config.API_ENDPOINT}/api/v1/twap`
      const body = {
        feedId: param.feedId,
        windowSeconds: param.windowSeconds,
        ...(param.endTs !== undefined && { endTs: param.endTs }),
      }

      return {
        params: [param],
        request: {
          url: fullUrl,
          method: 'POST',
          headers: {
            ...generateAuthHeaders(
              config.API_USERNAME,
              config.API_PASSWORD,
              'POST',
              fullUrl,
              JSON.stringify(body),
            ),
            'Content-Type': 'application/json',
          },
          data: body,
        },
      }
    })
  },

  parseResponse: (params, response) => {
    const data = response.data
    if (!data || !data.result || data.samples == null) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider returned an incomplete response for feedId ${param.feedId}`,
          statusCode: 502,
        },
      }))
    }

    return params.map((param) => ({
      params: param,
      response: {
        result: data.result,
        data: {
          result: data.result,
          feedId: data.feedId,
          samples: data.samples,
          decimals: data.decimals,
          windowStartTs: data.windowStartTs,
          windowEndTs: data.windowEndTs,
          effectiveWindowStartTs: data.effectiveWindowStartTs,
          effectiveWindowEndTs: data.effectiveWindowEndTs,
        },
      },
    }))
  },
}

export const twapTransport = new HttpTransport<HttpTransportTypes>(twapTransportConfig)
