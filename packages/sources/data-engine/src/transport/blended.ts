import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/blended'

export interface BlendedRequestBody {
  market: string
  feeds: Record<string, string>
}

export interface BlendedResponseBody {
  data?: {
    rawStitchedPrice: string
    rawPrice: string
    indicatorPrice: string
    decimals: number
    indicatorType: string
    stitchingType: string
    market: string
    session: string
  }
  timestamps?: {
    evaluatedAtTs: number
    observationsTimestamp: number
    windowStartTs: number
    windowEndTs: number
  }
  metadata?: {
    feedsUsed: string[]
    stitchingApplied: boolean
    anchor: { price: string; ts: number; ageSeconds: number } | null
    stitching: { mode: string; params: Record<string, unknown>; phase: string }
    indicator: { type: string; windowSeconds: number; endTs: number }
  }
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

    return params.map((param) => ({
      params: param,
      response: {
        result: data.indicatorPrice,
        data: {
          rawStitchedPrice: data.rawStitchedPrice,
          rawPrice: data.rawPrice,
          indicatorPrice: data.indicatorPrice,
          decimals: data.decimals,
          indicatorType: data.indicatorType,
          stitchingType: data.stitchingType,
          market: data.market,
          session: data.session,
          evaluatedAtTs: timestamps.evaluatedAtTs,
          observationsTimestamp: timestamps.observationsTimestamp,
          windowStartTs: timestamps.windowStartTs,
          windowEndTs: timestamps.windowEndTs,
          feedsUsed: metadata.feedsUsed,
          stitchingApplied: metadata.stitchingApplied,
          anchor: metadata.anchor,
          stitchingMode: metadata.stitching.mode,
          stitchingParams: metadata.stitching.params,
          stitchingPhase: metadata.stitching.phase,
          indicatorWindowSeconds: metadata.indicator.windowSeconds,
          indicatorEndTs: metadata.indicator.endTs,
        },
      },
    }))
  },
}

export const blendedTransport = new HttpTransport<HttpTransportTypes>(blendedTransportConfig)
