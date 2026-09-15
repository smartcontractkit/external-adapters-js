import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import {
  BaseEndpointTypes,
  BlendedData,
  BlendedMetadata,
  BlendedTimestamps,
} from '../endpoint/blended'
import { resolveResult } from './utils'

export interface BlendedRequestBody {
  market: string
  feeds: Record<string, string>
}

export interface BlendedResponseBody {
  data?: BlendedData
  timestamps?: BlendedTimestamps
  metadata?: BlendedMetadata
  error?: string
  feedID?: string
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: BlendedRequestBody
    ResponseBody: BlendedResponseBody
  }
}

export const blendedTransportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const fullUrl = `${config.API_ENDPOINT}/api/v1/blended`
      const feeds: BlendedRequestBody['feeds'] = {
        open: param.open,
        closed: param.closed,
      }
      if (param.overnight && param.extended) {
        feeds.overnight = param.overnight
        feeds.extended = param.extended
      }
      const body = {
        market: param.market,
        feeds,
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
          // Resolve non-2xx responses so parseResponse can pass through the
          // provider status code (e.g. 400 PARSE_ERROR, 503 insufficient data)
          validateStatus: () => true,
        },
      }
    })
  },

  parseResponse: (params, response) => {
    const body = response.data

    if (response.status !== 200) {
      const statusCode = response.status === 400 || response.status === 503 ? response.status : 502
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider returned status ${response.status} for market ${
            param.market
          }: ${JSON.stringify(body)}`,
          statusCode,
        },
      }))
    }

    const { data, timestamps, metadata } = body
    if (!data?.indicatorPrice || !timestamps || !metadata) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider returned an incomplete response for market ${param.market}`,
          statusCode: 502,
        },
      }))
    }

    return params.map((param) => {
      const responseData: HttpTransportTypes['Response']['Data'] = {
        ...data,
        ...timestamps,
        ...metadata,
      }

      try {
        const result =
          param.resultPath !== undefined
            ? (resolveResult(
                responseData,
                param.resultPath,
                param.decimals,
                data.decimals,
              ) as string)
            : data.indicatorPrice

        return {
          params: param,
          response: {
            result,
            data: responseData,
            timestamps: {
              providerIndicatedTimeUnixMs: timestamps.observationsTimestamp * 1000,
            },
          },
        }
      } catch (e) {
        return {
          params: param,
          response: {
            statusCode: 400,
            errorMessage: (e as Error).message,
          },
        }
      }
    })
  },
}

export const blendedTransport = new HttpTransport<HttpTransportTypes>(blendedTransportConfig)
