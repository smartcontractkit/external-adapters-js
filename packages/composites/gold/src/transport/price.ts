import { getCryptoPrice, getRwaPrice } from '@chainlink/data-engine-adapter'
import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'

const logger = makeLogger('PriceTransport')

type RequestParams = typeof inputParameters.validated

type CryptoPriceResponse = {
  bid: string
  ask: string
  price: string
  decimals: number
}

type RwaPriceResponse = {
  midPrice: string
  marketStatus: number
  decimals: number
}

const RESULT_DECIMALS = 18

export class PriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  requester!: Requester
  tokenizedPriceStreamsConfig!: Record<string, string>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.requester = dependencies.requester
    this.tokenizedPriceStreamsConfig = JSON.parse(this.config.TOKENIZED_GOLD_PRICE_STREAMS)
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

  async _handleRequest(_: RequestParams): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [xauResponse, ...tokenizedPriceResponses]: [
      RwaPriceResponse,
      ...{
        name: string
        response: CryptoPriceResponse
      }[],
    ] = await Promise.all([
      getRwaPrice(this.config.XAU_FEED_ID, this.config.DATA_ENGINE_ADAPTER_URL, this.requester),
      ...Object.entries(this.tokenizedPriceStreamsConfig).map(async ([name, feedId]) => ({
        name,
        response: await getCryptoPrice(feedId, this.config.DATA_ENGINE_ADAPTER_URL, this.requester),
      })),
    ])

    const { midPrice: xauPrice, decimals } = xauResponse

    this.verifyDecimals('XAU', decimals)

    let result: string

    if (xauResponse.marketStatus === MarketStatus.OPEN) {
      result = xauPrice
    } else {
      result = this.calculateCompositePrice(tokenizedPriceResponses).toString()
    }

    return {
      statusCode: 200,
      result,
      data: {
        result,
        decimals: RESULT_DECIMALS,
        marketStatus: xauResponse.marketStatus,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  calculateCompositePrice(
    tokenizedPriceResponses: { name: string; response: CryptoPriceResponse }[],
  ): bigint {
    let sumPrice = 0n
    let count = 0n

    for (const { name, response } of tokenizedPriceResponses) {
      this.verifyDecimals(name, response.decimals)
      const price = BigInt(response.price)

      sumPrice += price
      count += 1n
    }

    return sumPrice / count
  }

  verifyDecimals(streamName: string, decimals: number): void {
    if (decimals !== RESULT_DECIMALS) {
      throw new AdapterError({
        statusCode: 500,
        message: `Unexpected ${streamName} price stream decimals: ${decimals}, expected: ${RESULT_DECIMALS}`,
      })
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const priceTransport = new PriceTransport()
