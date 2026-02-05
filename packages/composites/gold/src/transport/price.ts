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
  marketStatus: MarketStatus
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
    try {
      this.tokenizedPriceStreamsConfig = JSON.parse(this.config.TOKENIZED_GOLD_PRICE_STREAMS)
    } catch (e: unknown) {
      throw new AdapterError({
        statusCode: 500,
        message: `Failed to parse TOKENIZED_GOLD_PRICE_STREAMS from adapter config: ${e}`,
      })
    }
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

    const [xauResponse, tokenizedPriceResponses]: [
      RwaPriceResponse,
      {
        name: string
        response: PromiseSettledResult<CryptoPriceResponse>
      }[],
    ] = await Promise.all([
      getRwaPrice(this.config.XAU_FEED_ID, this.config.DATA_ENGINE_ADAPTER_URL, this.requester),
      this.getTokenizedPriceResponses(),
    ])

    const { midPrice: xauPrice, decimals } = xauResponse

    this.verifyDecimals('XAU', decimals)

    let result: string

    if (xauResponse.marketStatus === MarketStatus.OPEN) {
      result = xauPrice
    } else {
      result = this.calculateCompositePrice(BigInt(xauPrice), tokenizedPriceResponses).toString()
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
    xauPrice: bigint,
    tokenizedPriceResponses: {
      name: string
      response: PromiseSettledResult<CryptoPriceResponse>
    }[],
  ): bigint {
    let sumPrice = 0n
    let count = 0n

    for (const { name, response } of tokenizedPriceResponses) {
      if (response.status !== 'fulfilled') {
        logger.warn(`Error fetching ${name} price: ${response.reason}`)
        continue
      }

      this.verifyDecimals(name, response.value.decimals)
      const price = BigInt(response.value.price)

      sumPrice += price
      count += 1n
    }

    if (count === 0n) {
      return xauPrice
    }

    return sumPrice / count
  }

  async getTokenizedPriceResponses(): Promise<
    {
      name: string
      response: PromiseSettledResult<CryptoPriceResponse>
    }[]
  > {
    const configEntries: Array<[string, string]> = Object.entries(this.tokenizedPriceStreamsConfig)
    const responses: PromiseSettledResult<CryptoPriceResponse>[] = await Promise.allSettled(
      configEntries.map(async ([_name, feedId]) =>
        getCryptoPrice(feedId, this.config.DATA_ENGINE_ADAPTER_URL, this.requester),
      ),
    )
    const result: {
      name: string
      response: PromiseSettledResult<CryptoPriceResponse>
    }[] = configEntries.map(([name], index) => ({ name, response: responses[index] }))
    return result
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
