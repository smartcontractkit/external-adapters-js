import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import glvAbi from '../config/glvReaderAbi.json'
import { GlvPriceEndpointTypes } from '../endpoint/glv-price'
import { ChainKey } from '../endpoint/gm-price'
import { ChainContextFactory } from './shared/chain'
import { GmxClient } from './shared/gmx-client'
import { fetchMedianPricesForAssets } from './shared/token-prices'
import { dedupeAssets, median, SIGNED_PRICE_DECIMALS, toFixed } from './shared/utils'

const logger = makeLogger('GmxTokensGlvBase')

export type GlvTransportParams<T extends GlvPriceEndpointTypes> = TypeFromDefinition<
  T['Parameters']
> & { glv: string; chain?: ChainKey }

export abstract class BaseGlvTransport<
  T extends GlvPriceEndpointTypes,
> extends SubscriptionTransport<T> {
  abstract backgroundHandler(
    context: EndpointContext<T>,
    entries: GlvTransportParams<T>[],
  ): Promise<void>

  abstract handleRequest(param: GlvTransportParams<T>): Promise<void>

  protected abstract formatResponse(
    result: number,
    minimizedValue: number,
    maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: {
      providerDataRequestedUnixMs: number
      providerDataReceivedUnixMs: number
      providerIndicatedTimeUnixMs: undefined
    },
  ): AdapterResponse<T['Response']>

  name!: string
  responseCache!: ResponseCache<T>
  requester!: Requester
  settings!: T['Settings']
  metadataClient!: GmxClient
  private chainContext!: ChainContextFactory

  async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.chainContext = new ChainContextFactory(adapterSettings)
    this.requester = dependencies.requester
    this.metadataClient = new GmxClient(this.requester, adapterSettings)
  }

  async _handleRequest(param: GlvTransportParams<T>): Promise<AdapterResponse<T['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const chain = param.chain as ChainKey
    const glv_address = param.glv.toLowerCase()

    const dataStoreAddress = this.chainContext.getDataStoreAddress(chain)
    const glvReaderContract = this.chainContext.getGlvReaderContract(chain, glvAbi)
    const glvInfo = await glvReaderContract.getGlvInfo(dataStoreAddress, glv_address)

    const [longToken, shortToken] = await Promise.all([
      this.metadataClient.getTokenByAddress(glvInfo.glv.longToken, chain),
      this.metadataClient.getTokenByAddress(glvInfo.glv.shortToken, chain),
    ])
    const glvMarkets = await Promise.all(
      glvInfo.markets.map((marketToken: string) =>
        this.metadataClient.getMarketByToken(marketToken, chain),
      ),
    )
    const indexTokens = await Promise.all(
      glvMarkets.map((market) => this.metadataClient.getTokenByAddress(market.indexToken, chain)),
    )
    const assets = dedupeAssets([
      { symbol: longToken.symbol, decimals: longToken.decimals, address: longToken.address },
      { symbol: shortToken.symbol, decimals: shortToken.decimals, address: shortToken.address },
      ...indexTokens.map((token) => ({
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address,
      })),
    ])

    const priceResult = await this.fetchPrices(assets, providerDataRequestedUnixMs, chain)

    const indexTokensPrices: Array<string | number>[] = indexTokens.map((token) => {
      const prices = priceResult.prices[token.symbol]
      return [prices.bid, prices.ask]
    })

    const glvTokenPriceContractParams = [
      dataStoreAddress,
      glvMarkets.map((market) => market.marketToken),
      indexTokensPrices.map(([a, b]) => [a, b]),
      [priceResult.prices[longToken.symbol].bid, priceResult.prices[longToken.symbol].ask],
      [priceResult.prices[shortToken.symbol].bid, priceResult.prices[shortToken.symbol].ask],
      glv_address,
    ]

    const [[maximizedPriceRaw], [minimizedPriceRaw]] = await Promise.all([
      glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, true),
      glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(ethers.formatUnits(maximizedPriceRaw, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(ethers.formatUnits(minimizedPriceRaw, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    return this.formatResponse(
      result,
      minimizedPrice,
      maximizedPrice,
      priceResult.sources,
      timestamps,
    )
  }

  private async fetchPrices(
    assets: Array<{ symbol: string; decimals: number; address: string }>,
    dataRequestedTimestamp: number,
    chain: ChainKey,
  ) {
    const { medianValues, priceProviders } = await fetchMedianPricesForAssets({
      assets: assets.map((token) => ({
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address,
      })),
      requester: this.requester,
      dataEngineUrl: this.settings.DATA_ENGINE_ADAPTER_URL,
      dataStoreContract: this.chainContext.getDataStore(chain),
      dataRequestedTimestamp,
      onError: (asset, error) =>
        logger.error(
          `Error fetching data for ${asset} from data-engine, url - ${this.settings.DATA_ENGINE_ADAPTER_URL}: ${error.message}`,
        ),
    })

    const prices: Record<string, Record<string, string | number>> = {}
    medianValues.forEach((v) => {
      const token = assets.find((asset) => asset.symbol === v.asset)
      if (!token) {
        throw new Error(`Missing metadata for asset '${v.asset}'`)
      }
      prices[v.asset] = {
        ...v,
        ask: toFixed(v.ask, token.decimals),
        bid: toFixed(v.bid, token.decimals),
      }
    })

    return {
      prices,
      sources: priceProviders,
    }
  }

  protected handleError(e: unknown): AdapterResponse<T['Response']> {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
    logger.error(e, errorMessage)
    return {
      statusCode: 502,
      errorMessage,
      timestamps: {
        providerDataRequestedUnixMs: 0,
        providerDataReceivedUnixMs: 0,
        providerIndicatedTimeUnixMs: undefined,
      },
    } as AdapterResponse<T['Response']>
  }

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
