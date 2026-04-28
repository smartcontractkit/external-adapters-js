import {
  EndpointContext,
  MarketStatus,
  MarketStatusResultResponse,
  TwentyfourFiveMarketStatus,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

import { BaseMarketStatusEndpointTypes } from '../endpoint/common'
import { inputParameters } from '../endpoint/market-status'
import { SourceName } from '../source/sources'
import { getStatusFromStaticSchedule, isStaticSource } from '../source/static'

const logger = makeLogger('BaseMarketStatusTransport')

export type MarketStatusResult = {
  marketStatus: MarketStatusResultResponse['Result']
  statusString: string
  providerIndicatedTimeUnixMs: number
  source?: SourceName
}

type RequestParams = typeof inputParameters.validated

export abstract class BaseMarketStatusTransport<
  T extends BaseMarketStatusEndpointTypes,
> extends SubscriptionTransport<BaseMarketStatusEndpointTypes> {
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseMarketStatusEndpointTypes>,
    adapterSettings: BaseMarketStatusEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<T>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<T>, param: RequestParams) {
    const requestedAt = Date.now()

    let response: AdapterResponse<T['Response']>
    try {
      const rawResult = await this._handleRequest(context, param)
      const result = this.convertMarketStatus(rawResult, param.force245MarketStatus)
      response = {
        data: {
          result: result.marketStatus,
          statusString: result.statusString,
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

  abstract _handleRequest(
    context: EndpointContext<T>,
    param: RequestParams,
  ): Promise<MarketStatusResult>

  async sendSourceRequest(
    context: EndpointContext<T>,
    sourceName: SourceName,
    param: TypeFromDefinition<typeof marketStatusEndpointInputParametersDefinition>,
  ): Promise<MarketStatusResult> {
    if (isStaticSource(sourceName)) {
      return getStatusFromStaticSchedule(sourceName, param.weekend)
    }
    const key = `${sourceName}:${JSON.stringify(param)}`
    const config = {
      method: 'POST',
      baseURL: context.adapterSettings[`${sourceName}_ADAPTER_URL`],
      data: {
        data: {
          endpoint: 'market-status',
          market: param.market,
          type: param.type,
          weekend: param.weekend,
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
          statusString:
            resp.response.data?.data?.statusString ?? MarketStatus[MarketStatus.UNKNOWN],
          providerIndicatedTimeUnixMs:
            resp.response.data?.timestamps?.providerIndicatedTimeUnixMs ?? Date.now(),
          source: sourceName,
        }
      } else {
        logger.error(
          `Request to ${sourceName} ${JSON.stringify(param)} got status ${resp.response.status}: ${
            resp.response.data
          }`,
        )
      }
    } catch (e) {
      logger.error(`Request to ${sourceName} ${JSON.stringify(param)} failed: ${e}`)
    }

    return {
      marketStatus: MarketStatus.UNKNOWN,
      statusString: MarketStatus[MarketStatus.UNKNOWN],
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }

  // UNKNOWN(0) => UNKNOWN(0), CLOSED(1) => WEEKEND(5), OPEN(2) => REGULAR(2)
  convertMarketStatus(marketStatus: MarketStatusResult, convert: boolean) {
    if (convert && marketStatus.marketStatus === MarketStatus.CLOSED) {
      return {
        ...marketStatus,
        marketStatus: TwentyfourFiveMarketStatus.WEEKEND,
        statusString: TwentyfourFiveMarketStatus[TwentyfourFiveMarketStatus.WEEKEND],
      }
    } else if (convert && marketStatus.marketStatus === MarketStatus.OPEN) {
      return {
        ...marketStatus,
        marketStatus: TwentyfourFiveMarketStatus.REGULAR,
        statusString: TwentyfourFiveMarketStatus[TwentyfourFiveMarketStatus.REGULAR],
      }
    }
    return marketStatus
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseMarketStatusEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
