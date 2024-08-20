import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'
import axios from 'axios'

import { inputParameters } from '../endpoint/market-status'
import type { BaseEndpointTypes } from '../endpoint/market-status'

export const adapterNames = ['NCFX', 'TRADINGHOURS'] as const

export type AdapterName = (typeof adapterNames)[number]

const marketAdapters: Record<string, Record<'primary' | 'secondary', AdapterName>> = {
  __default: {
    primary: 'TRADINGHOURS',
    secondary: 'NCFX',
  },
}

const logger = makeLogger('MarketStatusTransport')

type MarketStatusResult = {
  marketStatus: MarketStatus
  providerIndicatedTimeUnixMs: number
  source?: AdapterName
}

type RequestParams = typeof inputParameters.validated

export class MarketStatusTransport extends SubscriptionTransport<BaseEndpointTypes> {
  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    const requestedAt = Date.now()

    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      const result = await this._handleRequest(context, param)
      response = {
        data: {
          result: result.marketStatus,
          source: result.source,
        },
        result: result.marketStatus,
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs: requestedAt,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: result.providerIndicatedTimeUnixMs,
        },
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Unknown error occurred: ${e}`
      logger.error(e, errorMessage)
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: requestedAt,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<MarketStatusResult> {
    const market = param.market
    if (!market) {
      throw new Error(`Missing market in params: ${market}`)
    }

    const adapterNames = marketAdapters[market] ?? marketAdapters.__default

    const primaryResponse = await this.sendAdapterRequest(context, adapterNames.primary, market)
    if (primaryResponse.marketStatus !== MarketStatus.UNKNOWN) {
      return primaryResponse
    }

    logger.warn(`Primary adapter ${adapterNames.primary} returned unknown market status`)

    const secondaryResponse = await this.sendAdapterRequest(context, adapterNames.secondary, market)
    if (secondaryResponse.marketStatus !== MarketStatus.UNKNOWN) {
      return secondaryResponse
    }

    logger.error(
      `Secondary adapter ${adapterNames.secondary} returned unknown market status, defaulting to CLOSED`,
    )

    return {
      marketStatus: MarketStatus.CLOSED,
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }

  async sendAdapterRequest(
    context: EndpointContext<BaseEndpointTypes>,
    adapterName: AdapterName,
    market: string,
  ): Promise<MarketStatusResult> {
    const baseURL = context.adapterSettings[`${adapterName}_ADAPTER_URL`]
    const data = {
      data: {
        endpoint: 'market-status',
        market,
      },
    }
    try {
      const resp = await axios.post(baseURL, data, { timeout: 30_000 })
      return {
        marketStatus: resp.data?.result ?? MarketStatus.UNKNOWN,
        providerIndicatedTimeUnixMs:
          resp.data?.timestamps?.providerIndicatedTimeUnixMs ?? Date.now(),
        source: adapterName,
      }
    } catch (e) {
      logger.error(`Request to adapter ${adapterName} failed: ${e}`)
      return {
        marketStatus: MarketStatus.UNKNOWN,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new MarketStatusTransport()
