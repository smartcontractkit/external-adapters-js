import { getCryptoPrice, getRwaPrice } from '@chainlink/data-engine-adapter'
import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { updateEma } from './ema'

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

type EmaState = {
  average: string
  timestampMs: number
}

type TokenizedStreamState = {
  lastPrice: string
  lastPriceChangeTimestampMs: number
  // Average price the last time the market was open.
  // undefined until the first time the EA sees the market being open.
  openMarketEma: EmaState | undefined
}

export type State = {
  marketStatus: MarketStatus
  lastXauPrice: string
  nowMs: number
  // Average price the last time the market was open.
  // undefined until the first time the EA sees the market being open.
  xauOpenMarketEma: EmaState | undefined
  deviationEma: EmaState
  tokenizedStreams: Record<string, TokenizedStreamState>
}

const RESULT_DECIMALS = 18

export class PriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  requester!: Requester
  tokenizedPriceStreamsConfig!: Record<string, string>
  state!: State

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
    this.state = {
      marketStatus: MarketStatus.UNKNOWN,
      lastXauPrice: '0',
      nowMs: 0,
      xauOpenMarketEma: undefined,
      deviationEma: {
        average: '0',
        timestampMs: Date.now(),
      },
      tokenizedStreams: {},
    }
    for (const name of Object.keys(this.tokenizedPriceStreamsConfig)) {
      this.state.tokenizedStreams[name] = {
        lastPrice: '0',
        lastPriceChangeTimestampMs: 0,
        openMarketEma: undefined,
      }
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

    this.updateState(xauResponse, tokenizedPriceResponses)

    let result: string

    if (xauResponse.marketStatus === MarketStatus.OPEN) {
      result = xauPrice
    } else {
      result = this.calculateCompositePrice().toString()
    }

    return {
      statusCode: 200,
      result,
      data: {
        result,
        decimals: RESULT_DECIMALS,
        state: this.state,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  updateState(
    xauResponse: RwaPriceResponse,
    tokenizedPriceResponses: {
      name: string
      response: PromiseSettledResult<CryptoPriceResponse>
    }[],
  ): void {
    this.state.marketStatus = xauResponse.marketStatus
    this.state.lastXauPrice = xauResponse.midPrice
    this.state.nowMs = Date.now()

    if (this.state.marketStatus === MarketStatus.OPEN) {
      this.state.xauOpenMarketEma ??= {
        average: this.state.lastXauPrice,
        timestampMs: this.state.nowMs,
      }
      this.state.xauOpenMarketEma = this.updateEma(
        this.state.xauOpenMarketEma,
        this.state.lastXauPrice,
        this.state.nowMs,
        this.config.PREMIUM_EMA_TAU_MS,
      )
    }

    for (const { name, response } of tokenizedPriceResponses) {
      if (response.status !== 'fulfilled') {
        logger.warn(`Error fetching ${name} price: ${response.reason}`)
        continue
      }

      this.verifyDecimals(name, response.value.decimals)
      this.updateStreamState(this.state.tokenizedStreams[name], response.value)
    }

    this.updateDeviation()
  }

  updateStreamState(streamState: TokenizedStreamState, response: CryptoPriceResponse): void {
    const price = response.price
    if (price === streamState.lastPrice) {
      return
    }
    streamState.lastPrice = response.price
    streamState.lastPriceChangeTimestampMs = this.state.nowMs

    if (this.state.marketStatus === MarketStatus.OPEN) {
      streamState.openMarketEma ??= {
        average: streamState.lastPrice,
        timestampMs: this.state.nowMs,
      }
      streamState.openMarketEma = this.updateEma(
        streamState.openMarketEma,
        streamState.lastPrice,
        this.state.nowMs,
        this.config.PREMIUM_EMA_TAU_MS,
      )
    }
  }

  updateDeviation(): void {
    if (this.state.marketStatus === MarketStatus.OPEN) {
      this.state.deviationEma = {
        average: '0',
        timestampMs: this.state.nowMs,
      }
      return
    }

    if (!this.state.xauOpenMarketEma) {
      // We can't calculate what premium to invert.
      return
    }

    let sumPrice = 0n
    let count = 0n

    for (const state of Object.values(this.state.tokenizedStreams)) {
      if (!state.openMarketEma) {
        // We can't calculate what premium to invert.
        continue
      }

      const timeSinceLastChangeMs = this.state.nowMs - state.lastPriceChangeTimestampMs
      if (timeSinceLastChangeMs > this.config.PRICE_STALE_TIMEOUT_MS) {
        continue
      }

      const premiumFactor =
        (10n ** BigInt(RESULT_DECIMALS) * BigInt(state.openMarketEma.average)) /
        BigInt(this.state.xauOpenMarketEma.average)
      const derivedSpotPrice =
        (BigInt(state.lastPrice) * 10n ** BigInt(RESULT_DECIMALS)) / premiumFactor

      sumPrice += derivedSpotPrice
      count += 1n
    }

    const lastXauPrice = BigInt(this.state.lastXauPrice)
    if (count === 0n) {
      return
    }

    const spotPrice = sumPrice / count
    const deviation = (BigInt(10 ** RESULT_DECIMALS) * (spotPrice - lastXauPrice)) / lastXauPrice
    this.state.deviationEma = this.updateEma(
      this.state.deviationEma,
      deviation,
      this.state.nowMs,
      this.config.DEVIATION_EMA_TAU_MS,
    )
  }

  calculateCompositePrice(): bigint {
    const lastXauPrice = BigInt(this.state.lastXauPrice)
    const smoothedDeviation = BigInt(this.state.deviationEma.average)
    const compositePrice =
      lastXauPrice + (smoothedDeviation * lastXauPrice) / 10n ** BigInt(RESULT_DECIMALS)
    return compositePrice
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

  // Converts between string and bigint because our state needs to be
  // serializable.
  updateEma(
    previousState: EmaState,
    newDataPoint: bigint | string,
    nowMs: number,
    tauMs: number,
  ): EmaState {
    const newState = updateEma(
      {
        average: BigInt(previousState.average),
        timestampMs: previousState.timestampMs,
      },
      BigInt(newDataPoint),
      nowMs,
      tauMs,
    )
    return {
      average: newState.average.toString(),
      timestampMs: newState.timestampMs,
    }
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
