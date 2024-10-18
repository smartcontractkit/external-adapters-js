import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance2'
import { sign, getApiKeys, errorResponse } from './utils'
import {
  calculateCacheKey,
  calculateHttpRequestKey,
} from '@chainlink/external-adapter-framework/cache'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { sleep, AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'

const logger = makeLogger('Balance2Transport')

export interface ResponseSchema {
  balances: {
    symbol: string
    amount: string
    holds: string
    bonded_amount: string
    reserved_amount: string
    unbonding_amount: string
    unvested_amount: string
    pending_rewards_amount: string
    past_rewards_amount: string
    bondable_amount: string
    withdrawable_amount: string
    fiat_amount: string
  }[]
  type: string
  trading_balances: {
    total: string // Returns total in fiat amount
    holds: string
  }
  vault_balances: {
    total: string // Returns total in fiat amount
    holds: string
  }
}

export type BalanceTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

type RequestParams = typeof inputParameters.validated

// revisit if we have >100 separate portfolios using this EA
type BlipCacheValue = {
  result: number
  timestamp: number
}
const blipCache = new Map<string, BlipCacheValue>()

export class BalanceTransport extends SubscriptionTransport<BalanceTransportTypes> {
  settings!: BalanceTransportTypes['Settings']
  requester!: Requester
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BalanceTransportTypes>,
    adapterSettings: BalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
  }

  async backgroundHandler(
    context: EndpointContext<BalanceTransportTypes>,
    entries: RequestParams[],
  ) {
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
        statusCode: 502,
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
  ): Promise<AdapterResponse<BalanceTransportTypes['Response']>> {
    const { portfolio, symbol, type, apiKey, acceptDelay } = param
    const providerDataRequestedUnixMs = Date.now()

    const response = await this.sendBalanceRequest(portfolio, symbol, type, apiKey)
    if (!response) {
      return errorResponse(
        `The data provider did not return data for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        providerDataRequestedUnixMs,
      )
    }

    if (!response.balances) {
      return errorResponse(
        `The data provider response does not contain a balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        providerDataRequestedUnixMs,
      )
    }

    // The adapter only supports querying one asset at a time so the balances list should only contain 1 element
    if (response.balances.length !== 1) {
      return errorResponse(
        `The data provider response does not contain exactly one element in the balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        providerDataRequestedUnixMs,
      )
    }

    const result = Number(response.balances[0].amount)
    if (isNaN(result)) {
      return errorResponse(
        `The data provider returned non-numeric balance: ${response.balances[0].amount}`,
        providerDataRequestedUnixMs,
      )
    }

    const generateResponseBody = (r: number = result) => {
      return {
        result: r,
        data: {
          result: r,
        },
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    // If acceptDelay is false, return the new result right away
    if (!acceptDelay) {
      return generateResponseBody()
    }

    const cacheKey = calculateCacheKey({
      transportName: this.name,
      data: param,
      adapterName: this.responseCache.adapterName,
      endpointName: this.responseCache.endpointName,
      adapterSettings: this.responseCache.adapterSettings,
    })

    // If `result` doesn't match already cached response, don't update the response cache right away.
    // We want to delay returning the new value by time = DELAYED_RESPONSE_MS by caching this value
    // in a separate map for DELAYED_RESPONSE_MS.
    const cachedResponse = await this.responseCache.cache.get(cacheKey)
    if (!cachedResponse?.result || result === cachedResponse.result) {
      // If no cached result or the new result is the same as the cached result,
      // return the new result, which writes to or refreshes the response cache TTL
      // Clear the blipCache to avoid edge case where the value goes from x to y, then back to x, then back to y
      // which would maintain a value in the cache, registering the second y as having passed the cache threshold immediately
      logger.trace(`Preventatively deleting blipCache for ${cacheKey}`)
      blipCache.delete(cacheKey)
      return generateResponseBody()
    }

    const blipCacheValue = blipCache.get(cacheKey)

    // If the result is the same as the temporarily cached value in blipCache, we want to check if
    // the value in blipCache has been cached long enough to be considered "good"
    if (result === blipCacheValue?.result) {
      const isBlipCacheStale =
        blipCacheValue?.timestamp <= Date.now() - this.settings.DELAYED_RESPONSE_MS
      if (isBlipCacheStale) {
        // blipCache value has been cached long enough and seems like a good value, update the response cache
        logger.debug(`Deleting blipCache for ${cacheKey}`)
        blipCache.delete(cacheKey)
        return generateResponseBody()
      }
    } else {
      // blipCache value is missing or is not the same as the result, overwrite
      logger.debug(`Setting blipCache for ${cacheKey} to ${result}`)
      blipCache.set(cacheKey, { result, timestamp: providerDataRequestedUnixMs })
    }

    // At this point, we have a new result that is different from the cached result
    // and the blipCache value is still under the DELAYED_RESPONSE_MS threshold.
    // return the cached result
    return generateResponseBody(cachedResponse.result)
  }

  async sendBalanceRequest(
    portfolio: string,
    symbol: string,
    type: string,
    apiKey: string,
  ): Promise<ResponseSchema> {
    const [signingKey, accessKey, passPhrase] = getApiKeys(apiKey, this.settings)
    const timestamp = Math.floor(Date.now() / 1000)
    const method = 'GET'
    const path = `/v1/portfolios/${portfolio}/balances`
    const message = `${timestamp}${method}${path}`
    const signature = sign(message, signingKey)

    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: path,
      headers: {
        'X-CB-ACCESS-KEY': accessKey,
        'X-CB-ACCESS-PASSPHRASE': passPhrase,
        'X-CB-ACCESS-SIGNATURE': signature,
        'X-CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      },
      params: {
        symbols: symbol.toUpperCase(),
        balance_type: `${type.toUpperCase()}_BALANCES`,
      },
    }

    const res = await this.requester.request<ResponseSchema>(
      calculateHttpRequestKey<BalanceTransportTypes>({
        context: {
          adapterSettings: this.settings,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.params,
        transportName: this.name,
      }),
      requestConfig,
    )

    return res.response.data
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new BalanceTransport()
