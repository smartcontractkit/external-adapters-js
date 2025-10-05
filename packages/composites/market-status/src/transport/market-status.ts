import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterName, marketAdapters } from '../config/adapters'
import type { BaseEndpointTypes } from '../endpoint/market-status'
import { inputParameters } from '../endpoint/market-status'
import { BaseMarketStatusTransport } from './base-market-status'

const logger = makeLogger('MarketStatusTransport')

type MarketStatusResult = {
  marketStatus: MarketStatus
  providerIndicatedTimeUnixMs: number
  source?: AdapterName
}

type RequestParams = typeof inputParameters.validated

export class MarketStatusTransport extends BaseMarketStatusTransport {
  async _handleRequest(
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<MarketStatusResult> {
    const market = param.market
    const adapterNames = marketAdapters[market] ?? marketAdapters.__default

    const primaryResponse = await this.sendAdapterRequest(context, adapterNames.primary, market)
    if (primaryResponse.marketStatus !== MarketStatus.UNKNOWN) {
      return primaryResponse
    }

    logger.warn(
      `Primary adapter ${adapterNames.primary} for market ${market} returned unknown market status`,
    )

    const secondaryResponse = await this.sendAdapterRequest(context, adapterNames.secondary, market)
    if (secondaryResponse.marketStatus !== MarketStatus.UNKNOWN) {
      return secondaryResponse
    }

    logger.error(
      `Secondary adapter ${adapterNames.secondary} for market ${market} returned unknown market status, defaulting to UNKNOWN`,
    )

    return {
      marketStatus: MarketStatus.UNKNOWN,
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }
}

export const transport = new MarketStatusTransport()
