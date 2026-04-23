import {
  EndpointContext,
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import type { MarketStatusEndpointTypes } from '../endpoint/market-status'
import { inputParameters } from '../endpoint/market-status'
import { getMarketSources } from '../source/sources'
import type { MarketStatusResult } from './base-market-status'
import { BaseMarketStatusTransport } from './base-market-status'

const logger = makeLogger('MarketStatusTransport')

type RequestParams = typeof inputParameters.validated

const UNKNOWN_STATUS = [MarketStatus.UNKNOWN, TwentyfourFiveMarketStatus.UNKNOWN]

export class MarketStatusTransport extends BaseMarketStatusTransport<MarketStatusEndpointTypes> {
  async _handleRequest(
    context: EndpointContext<MarketStatusEndpointTypes>,
    param: RequestParams,
  ): Promise<MarketStatusResult> {
    const sources = getMarketSources(param.type, param.market)

    const primaryResponse = await this.sendSourceRequest(context, sources.primary, param)
    if (!UNKNOWN_STATUS.includes(primaryResponse.marketStatus)) {
      return primaryResponse
    }

    logger.warn(
      `Request ${JSON.stringify(param)} to primary source ${
        sources.primary
      } returned unknown market status`,
    )

    const secondaryResponse = await this.sendSourceRequest(context, sources.secondary, param)
    if (!UNKNOWN_STATUS.includes(secondaryResponse.marketStatus)) {
      return secondaryResponse
    }

    logger.error(
      `Request ${JSON.stringify(param)} tp secondary source ${
        sources.secondary
      } returned unknown market status, defaulting to UNKNOWN`,
    )

    return {
      marketStatus: MarketStatus.UNKNOWN,
      statusString: MarketStatus[MarketStatus.UNKNOWN],
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }
}

export const transport = new MarketStatusTransport()
