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

export class VeEuroMarketStatusTransport extends BaseMarketStatusTransport {
  async createAdapterRequest(
    context: EndpointContext<BaseEndpointTypes>,
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
    context: EndpointContext<BaseEndpointTypes>,
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

    // If any market is open, return open
    if (responses.some((response) => response.marketStatus === MarketStatus.OPEN)) {
      return {
        marketStatus: MarketStatus.OPEN,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }

    // If any response is unknown, return unknown
    if (responses.some((response) => response.marketStatus === MarketStatus.UNKNOWN)) {
      const unknownResponses = responses.filter(
        (response) => response.marketStatus === MarketStatus.UNKNOWN,
      )
      logger.warn('Responses with unknown status:', JSON.stringify(unknownResponses))
      return {
        marketStatus: MarketStatus.UNKNOWN,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }

    // Check if all markets are closed
    if (responses.every((response) => response.marketStatus === MarketStatus.CLOSED)) {
      return {
        marketStatus: MarketStatus.CLOSED,
        providerIndicatedTimeUnixMs: Date.now(),
      }
    }

    return {
      marketStatus: MarketStatus.UNKNOWN,
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }
}

export const transport = new VeEuroMarketStatusTransport()
