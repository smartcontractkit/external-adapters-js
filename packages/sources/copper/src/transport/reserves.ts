import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Decimal } from 'decimal.js'
import { ethers } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/reserves'
import {
  convertToUsd,
  fetchWalletsFromCopper,
  getChainlinkPrice,
  getFeedAddress,
  getSuperstateNav,
  isSupportedAsset,
  PriceData,
  Wallet,
} from './priceFeed'

const logger = makeLogger('CopperReservesTransport')

interface AssetData {
  balance: Decimal
  stakeBalance: Decimal
  custodyUsd: Decimal
  stakingUsd: Decimal
}

export type TransportTypes = BaseEndpointTypes

export class ReservesTransport extends SubscriptionTransport<TransportTypes> {
  provider!: ethers.JsonRpcProvider
  settings!: TransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.ETHEREUM_CHAIN_ID,
    )
  }

  async backgroundHandler(
    context: EndpointContext<TransportTypes>,
    entries: object[],
  ): Promise<void> {
    if (entries.length === 0) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
      return
    }

    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: object): Promise<void> {
    let response: AdapterResponse<TransportTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      logger.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(): Promise<AdapterResponse<TransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const wallets = await fetchWalletsFromCopper(
      this.settings.API_ENDPOINT,
      this.settings.COPPER_API_KEY,
      this.settings.COPPER_API_SECRET,
    )
    const providerDataReceivedUnixMs = Date.now()

    if (!wallets || !Array.isArray(wallets)) {
      return {
        statusCode: 502,
        errorMessage: 'No wallets data received from Copper API',
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    Decimal.set({ precision: 30 })

    const assets: Record<string, AssetData> = {}

    for (const wallet of wallets) {
      const currency = wallet.currency.toUpperCase()
      if (!isSupportedAsset(currency)) {
        continue
      }

      const balance = new Decimal(wallet.balance || '0')
      const stakeBalance = new Decimal(wallet.stakeBalance || '0')

      if (!assets[currency]) {
        assets[currency] = {
          balance: new Decimal(0),
          stakeBalance: new Decimal(0),
          custodyUsd: new Decimal(0),
          stakingUsd: new Decimal(0),
        }
      }

      assets[currency].balance = assets[currency].balance.plus(balance)
      assets[currency].stakeBalance = assets[currency].stakeBalance.plus(stakeBalance)
    }

    const priceCache: Record<string, PriceData> = {}
    let ustbNav: Decimal | null = null

    for (const currency of Object.keys(assets)) {
      if (currency === 'USTB') {
        if (ustbNav === null) {
          ustbNav = await getSuperstateNav(
            this.settings.SUPERSTATE_API_ENDPOINT,
            this.settings.USTB_FUND_ID,
          )
        }
      } else {
        const feedAddress = getFeedAddress(currency, this.settings)
        if (!feedAddress) {
          logger.warn(`No price feed address configured for supported asset: ${currency}`)
          continue
        }
        if (!priceCache[currency]) {
          priceCache[currency] = await getChainlinkPrice(feedAddress, this.provider)
        }
      }
    }

    let totalCustodyUsd = new Decimal(0)
    let totalStakingUsd = new Decimal(0)

    const STAKING_SUPPORTED_ASSETS = ['ETH', 'SOL']

    for (const [currency, data] of Object.entries(assets)) {
      let custodyUsd = new Decimal(0)
      let stakingUsd = new Decimal(0)

      if (!data.stakeBalance.isZero() && !STAKING_SUPPORTED_ASSETS.includes(currency)) {
        logger.warn(
          `Unexpected staking balance for ${currency}: ${data.stakeBalance.toString()}. Only ETH and SOL should have staking.`,
        )
      }

      if (currency === 'USTB' && ustbNav !== null) {
        custodyUsd = data.balance.mul(ustbNav)
        stakingUsd = data.stakeBalance.mul(ustbNav)
      } else if (priceCache[currency]) {
        custodyUsd = convertToUsd(data.balance, priceCache[currency])
        stakingUsd = convertToUsd(data.stakeBalance, priceCache[currency])
      }

      assets[currency].custodyUsd = custodyUsd
      assets[currency].stakingUsd = stakingUsd

      totalCustodyUsd = totalCustodyUsd.plus(custodyUsd)
      totalStakingUsd = totalStakingUsd.plus(stakingUsd)
    }

    const totalUsd = totalCustodyUsd.plus(totalStakingUsd)

    const latestUpdatedAt = wallets.reduce((max: number, w: Wallet) => {
      const updatedAt = Number(w.updatedAt)
      return !isNaN(updatedAt) && updatedAt > max ? updatedAt : max
    }, 0)

    const resultString = totalUsd.toFixed()
    const result = Number(resultString)

    if (totalUsd.greaterThan(Number.MAX_SAFE_INTEGER)) {
      logger.warn(
        `Total USD value ${resultString} exceeds Number.MAX_SAFE_INTEGER. Precision loss may occur.`,
      )
    }

    return {
      data: {
        result,
        ripcord: false,
      },
      result,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: latestUpdatedAt > 0 ? latestUpdatedAt : undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reservesTransport = new ReservesTransport()
