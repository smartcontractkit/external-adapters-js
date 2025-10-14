import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterName, marketAdapters } from '../config/adapters'
import type { MultiMarketStatusEndpointTypes } from '../endpoint/multi-market-status'
import { inputParameters } from '../endpoint/multi-market-status'
import { BaseMarketStatusTransport } from './base-market-status'

const logger = makeLogger('MarketStatusTransport')

type MarketStatusResult = {
  marketStatus: MarketStatus
  providerIndicatedTimeUnixMs: number
  source?: AdapterName
}

type RequestParams = typeof inputParameters.validated

export class MultiMarketStatusTransport extends BaseMarketStatusTransport<MultiMarketStatusEndpointTypes> {
  async createAdapterRequest(
    context: EndpointContext<MultiMarketStatusEndpointTypes>,
    adapterName: AdapterName,
    market: string,
  ): Promise<MarketStatusResult & { market: string }> {
    const response = await this.sendAdapterRequest(context, adapterName, market)
    return {
      market,
      source: adapterName,
      marketStatus: response.marketStatus,
      providerIndicatedTimeUnixMs: response.providerIndicatedTimeUnixMs,
    }
  }

  async _handleRequest(
    context: EndpointContext<MultiMarketStatusEndpointTypes>,
    param: RequestParams,
  ): Promise<MarketStatusResult> {
    const markets = param.market.split(',').map((m) => m.trim())
    const underlyingRequests = []

    for (const market of markets) {
      const adapterNames = marketAdapters[market] ?? marketAdapters.__default
      underlyingRequests.push(
        this.createAdapterRequest(context, adapterNames.primary, market),
        this.createAdapterRequest(context, adapterNames.secondary, market),
      )
    }

    const responses = await Promise.all(underlyingRequests)
    logger.debug('All responses:', JSON.stringify(responses))

    if (
      (param.openMode === 'any' &&
        responses.some((response) => response.marketStatus === MarketStatus.OPEN)) ||
      (param.openMode === 'all' &&
        responses.every((response) => response.marketStatus === MarketStatus.OPEN))
    ) {
      return {
        marketStatus: MarketStatus.OPEN,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }

    if (
      (param.closedMode === 'any' &&
        responses.some((response) => response.marketStatus === MarketStatus.CLOSED)) ||
      (param.closedMode === 'all' &&
        responses.every((response) => response.marketStatus === MarketStatus.CLOSED))
    ) {
      return {
        marketStatus: MarketStatus.CLOSED,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }

    const unknownResponses = responses.filter(
      (response) => response.marketStatus === MarketStatus.UNKNOWN,
    )
    logger.warn(
      'Returning UNKNOWN for param.market, responses with unknown status:',
      JSON.stringify(unknownResponses),
    )

    return {
      marketStatus: MarketStatus.UNKNOWN,
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }
}

export const transport = new MultiMarketStatusTransport()
