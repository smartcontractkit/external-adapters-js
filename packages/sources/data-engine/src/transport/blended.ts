import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  BaseEndpointTypes,
  BlendedData,
  BlendedMetadata,
  BlendedTimestamps,
  BlendedUnderlying,
} from '../endpoint/blended'
import { resolveResult } from './utils'

type RequestParams = TypeFromDefinition<BaseEndpointTypes['Parameters']>

export interface BlendedRequestBody {
  market: string
  feeds: Record<string, string>
  indicator?: RequestParams['indicator']
  stitching?: RequestParams['stitching']
}

export interface BlendedResponseBody {
  data?: BlendedData
  timestamps?: BlendedTimestamps
  underlying?: Omit<BlendedUnderlying, 'lastSeenTimestampNs'> & {
    lastSeenTimestampNs: string | number
  }
  metadata?: BlendedMetadata
}

/**
 * Recursively drops keys whose value is undefined, so optional params absent from the request
 * are absent from the provider body (and the signed payload) rather than serialized as nulls.
 */
const compact = <T>(value: T): T => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, compact(v)]),
  ) as T
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
      // indicator and stitching are only sent when set, so requests without them keep the
      // Data Engine defaults (twap, kalman) and an unchanged body
      const body: BlendedRequestBody = {
        market: param.market,
        feeds,
        ...(param.indicator && { indicator: compact(param.indicator) }),
        ...(param.stitching && { stitching: compact(param.stitching) }),
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
    const { data, timestamps, underlying, metadata } = response.data
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
        ...(underlying && {
          ...underlying,
          lastSeenTimestampNs: String(underlying.lastSeenTimestampNs),
        }),
        ...metadata,
      }

      try {
        const result = resolveResult(
          responseData,
          param.resultPath,
          param.decimals,
          data.decimals,
        ) as string

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
