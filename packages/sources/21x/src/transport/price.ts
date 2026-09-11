import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'

const logger = makeLogger('PriceTransport')

type RequestParams = typeof inputParameters.validated

export type TradeInfoResponse = {
  lastPrice: string
  referencePrice: string
  priceChange24h: string
  tradeVolume24h: string
  liquidityBand: number
  tradingStatus: string
  statusChangeReason: string
  tradingHaltCounter: number
}

export type OrderBookResponse = {
  tradingPairId: string
  buy: {
    orderType: string
    quantity: string
    limit: string
  }[]
  sell: {
    orderType: string
    quantity: string
    limit: string
  }[]
}

const convertTradingStatusToNumber = (status: string): number => {
  // Possible values are documented at:
  // https://docs.21x.eu/api-reference-v1.0/public-market-data#get-tradingpairs-id-tradeinfo
  switch (status) {
    case 'CREATED':
    case 'DISABLED':
    case 'PERMANENTLY_DELETED':
      return 0
    case 'CONTINUOUS_TRADING':
      return 2
    case 'OUT_OF_TRADING':
    case 'AUTOMATIC_TRADING_HALT':
    case 'MANUAL_TRADING_HALT':
      return 5
    default:
      logger.warn(`Unknown trading status: ${status}`)
      return 0
  }
}

export class PriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  endpointName!: string
  config!: BaseEndpointTypes['Settings']
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName
    this.requester = dependencies.requester
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
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [tradeInfo, orderBook] = await Promise.all([
      this.getTradeInfo(params.base),
      this.getOrderBook(params.base),
    ])

    const last_price = tradeInfo.lastPrice

    // The first elements are the top of the order book.
    const bid_price = orderBook.buy[0]?.limit
    const bid_volume = orderBook.buy[0]?.quantity
    const ask_price = orderBook.sell[0]?.limit
    const ask_volume = orderBook.sell[0]?.quantity

    const mid_price =
      bid_price !== undefined && ask_price !== undefined
        ? new Decimal(bid_price).plus(new Decimal(ask_price)).dividedBy(2).toString()
        : undefined

    const market_status = convertTradingStatusToNumber(tradeInfo.tradingStatus)

    return {
      data: {
        last_price,
        mid_price,
        bid_price,
        bid_volume,
        ask_price,
        ask_volume,
        market_status,
        trading_status_string: tradeInfo.tradingStatus,
      },
      statusCode: 200,
      result: last_price,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async makeApiRequest<T extends TradeInfoResponse | OrderBookResponse>(
    id: string,
    endpoint: 'tradeinfo' | 'orderbook',
  ): Promise<T> {
    const requestConfig = {
      method: 'GET',
      baseURL: this.config.API_ENDPOINT,
      url: `${id}/${endpoint}`,
    }

    const requestKey = requestConfig.url
    const response = await this.requester.request<T>(requestKey, requestConfig)

    return response.response.data
  }

  async getTradeInfo(id: string): Promise<TradeInfoResponse> {
    return this.makeApiRequest<TradeInfoResponse>(id, 'tradeinfo')
  }

  async getOrderBook(id: string): Promise<OrderBookResponse> {
    return this.makeApiRequest<OrderBookResponse>(id, 'orderbook')
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new PriceTransport()
