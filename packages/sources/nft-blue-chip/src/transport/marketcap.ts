import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterDependencies } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { RequestRateLimiter } from '@chainlink/external-adapter-framework/rate-limiting'
import * as rateLimitMetrics from '@chainlink/external-adapter-framework/rate-limiting/metrics'
import { Transport, TransportGenerics } from '@chainlink/external-adapter-framework/transports'

import { ethers } from 'ethers'
import { Decimal } from 'decimal.js'

import { customSettings } from '../config'
import BoredApeYachtClub from '../abi/BoredApeYachtClub.json'
import EACAggregatorProxy from '../abi/EACAggregatorProxy.json'

const logger = makeLogger('MarketcapTransport')

const RPC_COST = 1

const RPC_CHAIN_ID = 1 // Ethereum mainnet chain - NFT collections are tied to this

const ETH_USD_FEED_PROXY = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'

type NFTCollection = {
  name: string
  feed: string // ETH-denominated Chainlink floor price feed (proxy)
  token: string // Collection NFT Token contract
}

// See here for NFT FP feed list: https://docs.chain.link/data-feeds/nft-floor-price/addresses
const NFT_COLLECTIONS: NFTCollection[] = [
  {
    name: 'Azuki',
    feed: '0xA8B9A447C73191744D5B79BcE864F343455E1150',
    token: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
  },
  {
    name: 'Bored Ape Yacht Club',
    feed: '0x352f2Bc3039429fC2fe62004a1575aE74001CfcE',
    token: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  },
  {
    name: 'CloneX',
    feed: '0x021264d59DAbD26E7506Ee7278407891Bb8CDCCc',
    token: '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
  },
  {
    name: 'CoolCats',
    feed: '0xF49f8F5b931B0e4B4246E4CcA7cD2083997Aa83d',
    token: '0x1A92f7381B9F03921564a437210bB9396471050C',
  },
  {
    name: 'Cryptoadz',
    feed: '0xFaA8F6073845DBe5627dAA3208F78A3043F99bcA',
    token: '0x1CB1A5e65610AEFF2551A50f76a87a7d3fB649C6',
  },
  {
    name: 'CryptoPunks',
    feed: '0x01B6710B01cF3dd8Ae64243097d91aFb03728Fdd',
    token: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
  },
  {
    name: 'Doodles',
    feed: '0x027828052840a43Cc2D0187BcfA6e3D6AcE60336',
    token: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
  },
  {
    name: 'Mutant Ape Yacht Club',
    feed: '0x1823C89715Fe3fB96A24d11c917aCA918894A090',
    token: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
  },
  {
    name: 'VeeFriends',
    feed: '0x35bf6767577091E7f04707c0290b3f889e968307',
    token: '0xa3AEe8BcE55BEeA1951EF834b99f3Ac60d1ABeeB',
  },
  {
    name: 'World of Women',
    feed: '0xDdf0B85C600DAF9e308AFed9F597ACA212354764',
    token: '0xe785E82358879F061BC3dcAC6f0444462D4b5330',
  },
]

export type MarketcapTransportGenerics = TransportGenerics & {
  Provider: {
    RequestBody: unknown
    ResponseBody: unknown
  }
  CustomSettings: typeof customSettings
}

export interface MarketcapTransportConfig {
  options: {
    requestCoalescing: {
      enabled: boolean
      entropyMax?: number
    }
  }
}

// Much of the code in this transport is borrowed from the framework's RestTransport as an example
export class MarketcapTransport implements Transport<MarketcapTransportGenerics> {
  inFlightPrefix!: string
  cache!: Cache<AdapterResponse<MarketcapTransportGenerics['Response']>>
  inFlightCache!: Cache<boolean>
  rateLimiter!: RequestRateLimiter

  constructor(protected config: MarketcapTransportConfig) {}

  async initialize(
    dependencies: AdapterDependencies,
    config: AdapterConfig<MarketcapTransportGenerics['CustomSettings']>,
  ): Promise<void> {
    this.inFlightPrefix = 'InFlight-'
    this.cache = dependencies.cache as Cache<
      AdapterResponse<MarketcapTransportGenerics['Response']>
    >
    this.inFlightCache = dependencies.cache as Cache<boolean>
    this.rateLimiter = dependencies.requestRateLimiter

    this.config.options.requestCoalescing.enabled = config.REQUEST_COALESCING_ENABLED
    this.config.options.requestCoalescing.entropyMax = config.REQUEST_COALESCING_ENTROPY_MAX
  }

  protected async waitUntilUnderRateLimit(
    options: {
      maxRetries: number
      msBetweenRetries: number
    },
    retry = 0,
  ): Promise<void> {
    if (this.rateLimiter.isUnderLimits()) {
      logger.trace('Incoming request would not be under limits, moving on')
      return
    }

    if (retry >= options.maxRetries) {
      throw new AdapterError({
        statusCode: 504,
        message: `Marketcap Transport timed out while waiting for rate limit availability (max retries: ${options.maxRetries})`,
      })
    }

    logger.debug(`Request would be over rate limits, sleeping for ${options.msBetweenRetries}`)
    await sleep(options.msBetweenRetries)
    await this.waitUntilUnderRateLimit(options, retry + 1)
  }

  async foregroundExecute(
    req: AdapterRequest<MarketcapTransportGenerics['Request']>,
    config: AdapterConfig<MarketcapTransportGenerics['CustomSettings']>,
  ): Promise<AdapterResponse<MarketcapTransportGenerics['Response']> | undefined> {
    // Add some entropy here because of possible scenario where the key won't be set before multiple
    // other instances in a burst request try to access the coalescing key.
    const randomMs = Math.random() * (this.config.options.requestCoalescing.entropyMax || 0)
    await sleep(randomMs)

    // Check if request is in flight if coalescing is enabled
    const inFlight =
      this.config.options.requestCoalescing.enabled &&
      (await this.cache.get(this.inFlightPrefix + req.requestContext.cacheKey))
    if (inFlight) {
      logger.debug('Request is in flight, transport has been set up')
      return
    } else if (this.config.options.requestCoalescing.enabled) {
      // If it wasn't in flight and coalescing is disabled, register it as in flight
      const ttl =
        config.MARKETCAP_TRANSPORT_MAX_RATE_LIMIT_RETRIES *
        config.MARKETCAP_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES
      logger.debug('Setting up rest transport, setting request in flight in cache')
      await this.inFlightCache.set(
        this.inFlightPrefix + req.requestContext.cacheKey,
        true,
        ttl + 100,
      ) // Can't use Infinity for things like Redis
    }

    logger.trace('Check if we are under rate limits to perform request')
    const checkForRateLimit = async () => {
      return this.waitUntilUnderRateLimit({
        maxRetries: config.MARKETCAP_TRANSPORT_MAX_RATE_LIMIT_RETRIES,
        msBetweenRetries: config.MARKETCAP_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES,
      })
    }
    await checkForRateLimit()

    const provider = new ethers.providers.JsonRpcProvider(config.ETHEREUM_RPC_URL, RPC_CHAIN_ID)

    logger.trace('Fetch all collection data async')

    const collectionDataPromises = Promise.all(
      NFT_COLLECTIONS.map((collection) => {
        const tokenContract = new ethers.Contract(collection.token, BoredApeYachtClub, provider)
        const feedContract = new ethers.Contract(collection.feed, EACAggregatorProxy, provider)

        return Promise.all([
          collection.name,
          tokenContract.totalSupply(),
          feedContract.latestAnswer(),
          feedContract.decimals(),
        ])
      }),
    )

    const ethUsdFeed = new ethers.Contract(ETH_USD_FEED_PROXY, EACAggregatorProxy, provider)

    const ethUsdDataPromises = Promise.all([ethUsdFeed.latestAnswer(), ethUsdFeed.decimals()])

    logger.trace('Await data responses')

    const [collectionData, ethUsdData] = await Promise.all([
      collectionDataPromises,
      ethUsdDataPromises,
    ])

    logger.trace('Compute total market cap')

    let totalMarketcapEth = new Decimal(0)

    for (const collection of collectionData) {
      const name = collection[0]
      const totalSupply = collection[1].toString()
      const ethFloorPrice = collection[2].toString()
      const decimals = collection[3].toString()

      const collectionMarketcap = new Decimal(totalSupply)
        .mul(ethFloorPrice)
        .div(new Decimal(10).pow(decimals))

      logger.info({ name, totalSupply, ethFloorPrice, decimals, collectionMarketcap })

      totalMarketcapEth = totalMarketcapEth.add(collectionMarketcap)
    }

    const ethUsdPrice = ethUsdData[0].toString()
    const ethUsdDecimals = ethUsdData[1].toString()

    const totalMarketcapUsd = totalMarketcapEth
      .mul(ethUsdPrice)
      .div(new Decimal(10).pow(ethUsdDecimals))
      .toNumber()

    logger.info({ totalMarketcapEth, totalMarketcapUsd })

    const response: AdapterResponse<MarketcapTransportGenerics['Response']> = {
      statusCode: 200,
      data: totalMarketcapUsd,
      result: totalMarketcapUsd,
    }

    if (config.METRICS_ENABLED && config.EXPERIMENTAL_METRICS_ENABLED) {
      response.maxAge = Date.now() + config.CACHE_MAX_AGE
      response.meta = {
        metrics: { feedId: req.requestContext.meta?.metrics?.feedId || 'N/A' },
      }
    }

    logger.debug('Set computed response in cache')
    await this.cache.set(req.requestContext.cacheKey, response, config.CACHE_MAX_AGE)

    logger.trace('Record cost of data provider call')
    rateLimitMetrics.rateLimitCreditsSpentTotal
      .labels({
        feed_id: req.requestContext.meta?.metrics?.feedId || 'N/A',
        participant_id: req.requestContext.cacheKey,
      })
      .inc(RPC_COST)

    logger.trace('Update cacheHit flag in request meta for metrics use')
    req.requestContext.meta = {
      ...req.requestContext.meta,
      metrics: { ...req.requestContext.meta?.metrics, cacheHit: false },
    }

    if (this.config.options.requestCoalescing.enabled) {
      logger.debug('Set computed response in cache, remove in flight from cache')
      await this.cache.delete(this.inFlightPrefix)
    }

    return response
  }
}
