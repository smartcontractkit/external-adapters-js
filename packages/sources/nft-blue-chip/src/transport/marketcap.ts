import { RateLimiter } from '@chainlink/external-adapter-framework/rate-limiting'
import {
  Transport,
  TransportDependencies,
  TransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'

import { Decimal } from 'decimal.js'
import { ethers } from 'ethers'

import BoredApeYachtClub from '../abi/BoredApeYachtClub.json'
import EACAggregatorProxy from '../abi/EACAggregatorProxy.json'
import { config } from '../config'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

const logger = makeLogger('MarketcapTransport')

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
  Parameters: EmptyInputParameters
  Provider: {
    RequestBody: unknown
    ResponseBody: unknown
  }
  Settings: typeof config.settings
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
  name!: string
  responseCache!: TransportDependencies<MarketcapTransportGenerics>['responseCache']
  rateLimiter!: RateLimiter

  constructor(protected config: MarketcapTransportConfig) {}

  async initialize(
    dependencies: TransportDependencies<MarketcapTransportGenerics>,
    _: typeof config.settings,
    __: string,
    name: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.rateLimiter = dependencies.rateLimiter
    this.name = name
  }

  async foregroundExecute(
    req: AdapterRequest<EmptyInputParameters>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<MarketcapTransportGenerics['Response']> | undefined> {
    const provider = new ethers.providers.JsonRpcProvider(settings.ETHEREUM_RPC_URL, RPC_CHAIN_ID)

    logger.trace('Fetch all collection data async')
    const providerDataRequestedUnixMs = Date.now()

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
      data: {
        result: totalMarketcapUsd,
      },
      result: totalMarketcapUsd,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    logger.debug('Set computed response in cache')
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response,
      },
    ])

    return response
  }
}
