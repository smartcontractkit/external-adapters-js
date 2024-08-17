import {
  Adapter,
  AdapterDependencies,
  MarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { getRateLimitingTier } from '@chainlink/external-adapter-framework/rate-limiting'
import {
  RateLimiterFactory,
  RateLimitingStrategy,
} from '@chainlink/external-adapter-framework/rate-limiting/factory'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import type { BaseEndpointTypes } from '../endpoint/market-status'
import { Requester } from './requester'

export const adapterNames = ['NCFX', 'TRADINGHOURS'] as const

export type AdapterName = (typeof adapterNames)[number]

const marketAdapters: Record<string, Record<'primary' | 'secondary', AdapterName>> = {
  __default: {
    primary: 'TRADINGHOURS',
    secondary: 'NCFX',
  },
}

const logger = makeLogger('MarketStatusTransport')

type MarketStatusAdapterResponse = AdapterResponse<{
  Data: {
    result: MarketStatus
  }
  Result: MarketStatus
}>

export type HttpEndpointTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: {
      data: {
        endpoint: string
        market: string
      }
    }
    ResponseBody: MarketStatusAdapterResponse
  }
}

export const transport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, settings) => {
    const sendRequestAdapter = async (adapterName: AdapterName, config: AxiosRequestConfig) => {
      logger.debug(`Sending request to adapter ${adapterName}: ${JSON.stringify(config)}`)
      const baseURL = settings[`${adapterName}_ADAPTER_URL`]
      try {
        return await axios.request({ ...config, baseURL })
      } catch (err) {
        logger.error(`Request to adapter ${adapterName} failed: ${err}`)
        return {
          data: {
            data: {
              result: MarketStatus.UNKNOWN,
            },
            result: MarketStatus.UNKNOWN,
          },
          status: 200,
        } as AxiosResponse
      }
    }

    const overrideAxiosRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
      const market = config.data?.data?.market
      if (!market) {
        throw new Error(`Invalid market in request params: ${market}`)
      }

      const adapterNames = marketAdapters[market] ?? marketAdapters.__default

      const primaryResponse = await sendRequestAdapter(adapterNames.primary, config)
      if (primaryResponse.data.result !== MarketStatus.UNKNOWN) {
        return primaryResponse
      }

      logger.warn(`Primary adapter ${adapterNames.primary} returned unknown market status`)

      const secondaryResponse = await sendRequestAdapter(adapterNames.secondary, config)
      if (secondaryResponse.data.result !== MarketStatus.UNKNOWN) {
        return secondaryResponse
      }

      logger.error(`Secondary adapter ${adapterNames.secondary} returned unknown market status`)

      return {
        data: {
          data: {
            result: MarketStatus.CLOSED,
          },
          result: MarketStatus.CLOSED,
        },
        status: 200,
      } as AxiosResponse
    }

    return params.map((param) => {
      const market = param.market
      if (!market) {
        throw new Error(`Invalid market in params: ${market}`)
      }

      return {
        params: [param],
        request: {
          method: 'post',
          // The outer 'data' key identifies the JSON payload for axios. The inner 'data' key is
          // the part of the payload expected by an adapter server.
          data: {
            data: {
              endpoint: 'market-status',
              market: param.market,
            },
          },
          overrideAxiosRequest,
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: param,
        response: res.data,
      }
    })
  },
})

export const bootstrapDependencies = (
  adapter: Adapter,
  dependencies: Partial<AdapterDependencies>,
): void => {
  const rateLimitingTier = getRateLimitingTier(adapter.config.settings, adapter.rateLimiting?.tiers)
  dependencies.rateLimiter = RateLimiterFactory.buildRateLimiter(
    adapter.config.settings.RATE_LIMITING_STRATEGY as RateLimitingStrategy,
  ).initialize(adapter.endpoints, rateLimitingTier)
  dependencies.requester = new Requester(dependencies.rateLimiter, adapter.config.settings) as any
}
