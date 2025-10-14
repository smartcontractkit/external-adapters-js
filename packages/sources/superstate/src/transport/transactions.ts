import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/transactions'

import { getNavPrice, getTransactions, multiply } from './transactionUtils'

const logger = makeLogger('transactions')

type RequestParams = typeof inputParameters.validated

export class TransactionsTransport extends SubscriptionTransport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  endpointName!: string
  config!: BaseEndpointTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.endpointName = endpointName
    this.config = adapterSettings
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const transactions = await getTransactions(
      this.config.TRANSACTION_API_KEY,
      this.config.TRANSACTION_API_SECRET,
      param.ticker,
      param.transactionStatus,
      param.operations,
    )

    const nav = transactions.find((t) => !t.dollar_amount && !t.notional_value)
      ? await getNavPrice(param.fundId)
      : 0

    const hex = transactions
      .reduce((sum, curr) => {
        if (curr.dollar_amount) {
          return sum + multiply(param.decimals, curr.dollar_amount)
        } else if (curr.notional_value) {
          return sum + multiply(param.decimals, curr.share_amount, curr.notional_value)
        } else {
          return sum + multiply(param.decimals, curr.share_amount, nav.toString())
        }
      }, 0n)
      .toString(16)

    // Core node requires result in hex string with even digits
    const result = '0x' + (hex.length % 2 == 1 ? '0' : '') + hex

    return {
      data: {
        result,
        transactions,
        navPrice: nav,
        decimals: param.decimals,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transactionsTransport = new TransactionsTransport()
