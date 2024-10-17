import {
  EndpointContext,
  MarketStatus,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'

import { AdapterName, marketAdapters } from '../config/adapters'
import { inputParameters } from '../endpoint/market-status'
import type { BaseEndpointTypes } from '../endpoint/market-status'

const logger = makeLogger('MarketStatusTransport')

type MarketStatusResult = {
  marketStatus: MarketStatus
  providerIndicatedTimeUnixMs: number
  source?: AdapterName
}

type RequestParams = typeof inputParameters.validated

export class MarketStatusTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

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

  async sendAdapterRequest(
    context: EndpointContext<BaseEndpointTypes>,
    adapterName: AdapterName,
    market: string,
  ): Promise<MarketStatusResult> {
    const key = `${market}:${adapterName}`
    const config = {
      method: 'POST',
      baseURL: context.adapterSettings[`${adapterName}_ADAPTER_URL`],
      data: {
        data: {
          endpoint: 'market-status',
          market,
        },
      },
    }

    try {
      const resp = await this.requester.request<AdapterResponse<MarketStatusResultResponse>>(
        key,
        config,
      )
      if (resp.response.status === 200) {
        return {
          marketStatus: resp.response.data?.result ?? MarketStatus.UNKNOWN,
          providerIndicatedTimeUnixMs:
            resp.response.data?.timestamps?.providerIndicatedTimeUnixMs ?? Date.now(),
          source: adapterName,
        }
      } else {
        logger.error(
          `Request to ${adapterName} for market ${market} got status ${resp.response.status}: ${resp.response.data}`,
        )
      }
    } catch (e) {
      logger.error(`Request to ${adapterName} for market ${market} failed: ${e}`)
    }

    return {
      marketStatus: MarketStatus.UNKNOWN,
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new MarketStatusTransport()
