import {
  EndpointContext,
  MarketStatus,
  MarketStatusResultResponse,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util/types'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

import { AdapterName } from '../config/adapters'
import { BaseMarketStatusEndpointTypes } from '../endpoint/common'
import { inputParameters } from '../endpoint/market-status'

const logger = makeLogger('BaseMarketStatusTransport')

export type MarketStatusResult = {
  marketStatus: MarketStatusResultResponse['Result']
  statusString: string
  providerIndicatedTimeUnixMs: number
  source?: AdapterName
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
      const result = await this._handleRequest(context, param)
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

  async sendAdapterRequest(
    context: EndpointContext<T>,
    adapterName: AdapterName,
    param: TypeFromDefinition<typeof marketStatusEndpointInputParametersDefinition>,
  ): Promise<MarketStatusResult> {
    const key = `${adapterName}:${JSON.stringify(param)}`
    const config = {
      method: 'POST',
      baseURL: context.adapterSettings[`${adapterName}_ADAPTER_URL`],
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
          source: adapterName,
        }
      } else {
        logger.error(
          `Request to ${adapterName} ${JSON.stringify(param)} got status ${resp.response.status}: ${
            resp.response.data
          }`,
        )
      }
    } catch (e) {
      logger.error(`Request to ${adapterName} ${JSON.stringify(param)} failed: ${e}`)
    }

    return {
      marketStatus: MarketStatus.UNKNOWN,
      statusString: MarketStatus[MarketStatus.UNKNOWN],
      providerIndicatedTimeUnixMs: Date.now(),
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseMarketStatusEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
