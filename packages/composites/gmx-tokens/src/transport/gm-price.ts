import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import abi from '../config/readerAbi.json'
import { ChainKey, GmPriceEndpointTypes, gmPriceInputParameters } from '../endpoint/gm-price'
import { ChainContextFactory } from './shared/chain'
import { GmxClient, resolveFeedId } from './shared/gmx-client'
import { fetchTokenPrices } from './shared/token-prices'
import { median, PriceData, SIGNED_PRICE_DECIMALS, toFixed, unwrapAsset } from './shared/utils'

const logger = makeLogger('GmxTokensGmTransport')

type RequestParams = typeof gmPriceInputParameters.validated

export type GmTransportTypes = GmPriceEndpointTypes

export class GmTokenTransport extends SubscriptionTransport<GmTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTransportTypes>
  requester!: Requester
  settings!: GmTransportTypes['Settings']
  metadataClient!: GmxClient
  private chainContext!: ChainContextFactory

  async initialize(
    dependencies: TransportDependencies<GmTransportTypes>,
    adapterSettings: GmTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.chainContext = new ChainContextFactory(this.settings)
    this.metadataClient = new GmxClient(this.requester, adapterSettings)
  }

  async backgroundHandler(
    context: EndpointContext<GmTransportTypes>,
    entries: TypeFromDefinition<GmTransportTypes['Parameters']>[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<GmTransportTypes['Response']>
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
  ): Promise<AdapterResponse<GmTransportTypes['Response']>> {
    const { index, long, short, market, chain } = param
    const assets = [index, long, short]
    const providerDataRequestedUnixMs = Date.now()
    const marketNormal = market.toLowerCase()

    const [indexToken, longToken, shortToken] = await Promise.all([
      this.metadataClient.getTokenBySymbol(index, chain),
      this.metadataClient.getTokenBySymbol(long, chain),
      this.metadataClient.getTokenBySymbol(short, chain),
    ])
    const decimalsMap = new Map(
      [indexToken, longToken, shortToken].map((t) => [t.symbol, t.decimals]),
    )

    const {
      prices: [indexPrices, longPrices, shortPrices],
      sources,
    } = await this.fetchPrices(assets, providerDataRequestedUnixMs, decimalsMap, chain)

    const tokenPriceContractParams = [
      this.chainContext.getDataStoreAddress(chain),
      [ethers.getAddress(marketNormal), indexToken.address, longToken.address, shortToken.address],
      [indexPrices.ask, indexPrices.bid],
      [longPrices.ask, longPrices.bid],
      [shortPrices.ask, shortPrices.bid],
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['string'], [this.settings.PNL_FACTOR_TYPE]),
      ),
    ]
    const readerContract = this.chainContext.getReaderContract(chain, abi)
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, true),
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(ethers.formatUnits(maximizedValue, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(ethers.formatUnits(minimizedValue, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    return {
      data: {
        result,
        sources,
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

  private async fetchPrices(
    assets: string[],
    dataRequestedTimestamp: number,
    decimals: Map<string, number>,
    chain: ChainKey,
  ) {
    const dataStoreContract = this.chainContext.getDataStore(chain)

    const assetRequests = await Promise.all(
      assets.map(async (asset) => ({
        key: asset,
        feedId: await resolveFeedId({
          dataStoreContract,
          tokenAddress: (await this.metadataClient.getTokenBySymbol(asset, chain)).address,
          tokenSymbol: asset,
          dataRequestedTimestamp,
        }),
        providerKey: unwrapAsset(asset),
      })),
    )

    const dataEngineUrl = this.settings.DATA_ENGINE_ADAPTER_URL
    const { priceData, priceProviders } = await fetchTokenPrices({
      assets: assetRequests,
      requester: this.requester,
      dataEngineUrl,
      onError: (asset, error) =>
        logger.error(
          `Error fetching data for ${asset} from data-engine, url - ${dataEngineUrl}: ${error.message}`,
        ),
    })

    this.validateRequiredResponses(priceProviders, dataRequestedTimestamp)

    const medianValues = this.calculateMedian(assets, priceData)

    const prices = medianValues.map((v) => {
      const decimal = decimals.get(v.asset)
      if (!decimal) {
        throw new Error(`Missing token decimals for '${v.asset}'`)
      }
      return {
        ...v,
        ask: toFixed(v.ask, decimal),
        bid: toFixed(v.bid, decimal),
      }
    })

    return {
      prices,
      sources: priceProviders,
    }
  }

  private calculateMedian(assets: string[], priceData: PriceData) {
    return assets.map((asset) => {
      const medianBid = median([...new Set(priceData[asset].bids)])
      const medianAsk = median([...new Set(priceData[asset].asks)])
      return { asset, bid: medianBid, ask: medianAsk }
    })
  }

  private validateRequiredResponses(
    priceProviders: Record<string, string[]> = {},
    dataRequestedTimestamp: number,
  ) {
    if (!Object.entries(priceProviders)?.length) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Missing responses from data-engine for all assets.`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: GmTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
