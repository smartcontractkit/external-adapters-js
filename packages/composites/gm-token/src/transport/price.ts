import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { ethers, utils } from 'ethers'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  EndpointContext,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  decimals,
  toFixed,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  tokenAddresses,
} from './utils'
import abi from './../config/readerAbi.json'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('GMToken')

type RequestParams = typeof inputParameters.validated

export type GmTokenTransportTypes = BaseEndpointTypes

export class GmTokenTransport extends SubscriptionTransport<GmTokenTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTokenTransportTypes>
  requester!: Requester
  provider!: ethers.providers.JsonRpcProvider
  readerContract!: ethers.Contract
  abiEncoder!: utils.AbiCoder
  settings!: GmTokenTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<GmTokenTransportTypes>,
    adapterSettings: GmTokenTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ARBITRUM_RPC_URL,
      adapterSettings.ARBITRUM_CHAIN_ID,
    )
    this.readerContract = new ethers.Contract(
      adapterSettings.READER_CONTRACT_ADDRESS,
      abi,
      this.provider,
    )
    this.abiEncoder = utils.defaultAbiCoder
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
  ): Promise<AdapterResponse<GmTokenTransportTypes['Response']>> {
    const { index, long, short, market } = param

    const assets = [index, long, short]

    const providerDataRequestedUnixMs = Date.now()

    const [indexPrices, longPrices, shortPrices] = await this.fetchPrices(
      assets,
      providerDataRequestedUnixMs,
    )

    const indexToken = tokenAddresses.arbitrum[index]
    const longToken = tokenAddresses.arbitrum[long]
    const shortToken = tokenAddresses.arbitrum[short]

    const tokenPriceContractParams = [
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      [market, indexToken, longToken, shortToken],
      [indexPrices.ask, indexPrices.bid],
      [longPrices.ask, longPrices.bid],
      [shortPrices.ask, shortPrices.bid],
      utils.keccak256(this.abiEncoder.encode(['string'], [this.settings.PNL_FACTOR_TYPE])),
    ]

    // Prices have a spread from min to max. The last param (maximize-true/false) decides whether to maximize the market token price
    // or not. We get both values and return the median.
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      this.readerContract.getMarketTokenPrice(...tokenPriceContractParams, true),
      this.readerContract.getMarketTokenPrice(...tokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(utils.formatUnits(maximizedValue, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(utils.formatUnits(minimizedValue, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    return {
      data: {
        result,
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

  // Fetches the lwba price info from multiple source EAs, calculates the median for bids and asks per asset and fixes the price precision
  private async fetchPrices(assets: string[], dataRequestedTimestamp: number) {
    // priceData holds raw bid/ask values per asset from source EAs response
    const priceData = {} as PriceData
    assets.forEach((a) => {
      priceData[a] = { bids: [], asks: [] }
    })

    const sources = [
      this.settings.TIINGO_ADAPTER_URL,
      this.settings.COINMETRICS_ADAPTER_URL,
      this.settings.NCFX_ADAPTER_URL,
    ]

    const promises = []

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]

      const assetPromises = assets.map(async (asset) => {
        const requestConfig = {
          url: source,
          method: 'POST',
          data: {
            data: {
              endpoint: 'crypto-lwba',
              base: this.unwrapAsset(asset),
              quote: 'USD',
            },
          },
        }

        // try/catch is mostly needed in a case if one of source EAs fails to return a response,
        // we will still get and calculate the median price based on responses of remaining EAs
        try {
          const response = await this.requester.request<{ data: LwbaResponseDataFields['Data'] }>(
            JSON.stringify(requestConfig),
            requestConfig,
          )
          const { bid, ask } = response.response.data.data

          priceData[asset] = {
            bids: [...priceData[asset].bids, bid],
            asks: [...priceData[asset].asks, ask],
          }
        } catch (error) {
          const e = error as Error
          logger.error(`Error fetching data for ${asset} from ${source}: ${e.message}`)
        }
      })

      promises.push(...assetPromises)
    }

    await Promise.all(promises)

    const medianValues = this.calculateMedian(assets, priceData, dataRequestedTimestamp)

    return medianValues.map((v) => ({
      ...v,
      ask: toFixed(v.ask, decimals[v.asset as keyof typeof decimals]),
      bid: toFixed(v.bid, decimals[v.asset as keyof typeof decimals]),
    }))
  }

  private calculateMedian(assets: string[], priceData: PriceData, dataRequestedTimestamp: number) {
    return assets.map((asset) => {
      if (!priceData[asset].bids.length || !priceData[asset].asks.length) {
        throw new AdapterDataProviderError(
          {
            statusCode: 502,
            message: `No data received for asset '${asset}' from all data providers.`,
          },
          {
            providerDataRequestedUnixMs: dataRequestedTimestamp,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        )
      }
      // Since most of the gm markets have the same long and index tokens, we need to remove duplicate values from duplicate requests
      const medianBid = median([...new Set(priceData[asset].bids)])
      const medianAsk = median([...new Set(priceData[asset].asks)])
      return { asset, bid: medianBid, ask: medianAsk }
    })
  }

  private unwrapAsset(asset: string) {
    if (asset === 'WBTC.b') {
      return 'BTC'
    }
    if (asset === 'WETH') {
      return 'ETH'
    }
    return asset
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
