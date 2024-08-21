import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance2'
import { sign, getApiKeys } from './utils'
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
// const myCache = CacheFactory.buildCache({cacheType: 'local', maxSizeForLocalCache: 100})
type BlipCacheValue = {
  result: number
  timestamp: number
}
const blipCache = new Map<string, BlipCacheValue>()
const BLIP_DURATION_MS = 120000

// export class WalletTransport extends SubscriptionTransport<WalletTransportTypes> {
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
      return {
        errorMessage: `The data provider did not return data for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    if (!response.balances) {
      return {
        errorMessage: `The data provider response does not contain a balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    // The adapter only supports querying one asset at a time so the balances list should only contain 1 element
    if (response.balances.length !== 1) {
      return {
        errorMessage: `The data provider response does not contain exactly one element in the balances list for Portfolio: ${param.portfolio}, Balance Type: ${param.type}, Symbol: ${param.symbol}`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    const result = Number(response.balances[0].amount)
    if (isNaN(result)) {
      return {
        errorMessage: `The data provider returned non-numeric balance: ${response.balances[0].amount}`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
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

    // standard REST API case
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

    // if `result` doesn't match cached response, we want to delay returning the new value
    // by 2 minutes, ie: we don't want to update the response cache right away.
    // we'll do this by caching this value in a separate map for 2 minutes
    // TODO make 2 minutes configurable
    const responseCacheData = await this.responseCache.cache.get(cacheKey)
    if (!responseCacheData || !responseCacheData.result) {
      console.log('no responseCacheData found')
      return generateResponseBody()
    } else if (responseCacheData.result === result) {
      console.log('responseCacheData and latest result are the same')
      return generateResponseBody()
    }

    const blipCacheData = blipCache.get(cacheKey)
    console.log('responseCacheData = ')
    console.log(responseCacheData)
    console.log('blipCacheData = ')
    console.log(blipCacheData)

    // result is found in blipCache, want to update TTL of the cached value
    if (result === blipCacheData?.result) {
      console.log(
        `blipCache timestamp = ${blipCacheData?.timestamp}, blipmin = ${
          Date.now() - BLIP_DURATION_MS
        }, isless = ${blipCacheData?.timestamp < Date.now() - BLIP_DURATION_MS}`,
      )
      if (blipCacheData?.timestamp > Date.now() - BLIP_DURATION_MS) {
        console.log(`rewriting responseCache ${cacheKey}`)
        // await this.responseCache.writeTTL(this.name, [param], this.settings.CACHE_MAX_AGE)
        // return generateResponseBody(a.result)
      } else {
        // blipCacheValue has been cached long enough and seems like a good value
        console.log(`removing local ${cacheKey}`)
        blipCache.delete(cacheKey)
        return generateResponseBody()
      }
    } else {
      // blipCacheValue not the same as result, overwrite
      console.log(`overwriting local ${cacheKey}`)
      blipCache.set(cacheKey, { result, timestamp: providerDataRequestedUnixMs })
    }

    return generateResponseBody(responseCacheData.result)
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

    console.log(res.response.data)
    return res.response.data
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new BalanceTransport()
