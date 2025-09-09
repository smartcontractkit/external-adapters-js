import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/eusx-price'

import type { Idl } from '@coral-xyz/anchor'
import { type Address } from '@solana/addresses'
import { getUtf8Encoder } from '@solana/codecs-strings'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import BN from 'bn.js'

import * as YieldVaultIDL from '../idl/eusx_yield_vault.json'
import { SolanaAccountReader } from '../shared/account-reader'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('EUSXPriceTransport')

export type EUSXPriceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

// Types for Solana accounts - snake_case due to using BorschCoder directly instead of Anchor
type VestingSchedule = {
  vesting_amount?: BN
  start_time?: BN
  end_time?: BN
}
type YieldPool = {
  shares_supply?: BN
  total_assets?: BN
}

const VESTING_SCHEDULE_SEED = 'VESTING_SCHEDULE'
const VESTING_SCHEDULE_ACCOUNT_NAME = 'VestingSchedule'
const YIELD_POOL_SEED = 'YIELD_POOL'
const YIELD_POOL_ACCOUNT_NAME = 'YieldPool'

export class EUSXPriceTransport extends SubscriptionTransport<EUSXPriceTransportTypes> {
  accountReader!: SolanaAccountReader
  utfEncoder!: ReturnType<typeof getUtf8Encoder>
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<EUSXPriceTransportTypes>,
    adapterSettings: EUSXPriceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.accountReader = new SolanaAccountReader()
    this.rpc = new SolanaRpcFactory().create()
    this.utfEncoder = getUtf8Encoder()
  }

  async backgroundHandler(
    context: EndpointContext<EUSXPriceTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<EUSXPriceTransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
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

  // calcEusxPrice based on gist given from Solstice Labs: https://gist.github.com/Thomas-Solstice/3cdae5b1ebf5d74ea638cd2063a26687
  calcEusxPrice(sharesSupply: number, totalAssets: number): number {
    const numerator = totalAssets + 1
    const denominator = sharesSupply + 1
    return denominator === 0 ? 0 : numerator / denominator
  }

  async _handleRequest(
    params: RequestParams,
  ): Promise<AdapterResponse<EUSXPriceTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const accountReader = this.accountReader
    const programAddress = params.address as Address
    try {
      const [vestingSchedule, yieldPool] = await Promise.all([
        accountReader.fetchAccountInformationByAddressAndSeeds<VestingSchedule>(
          this.rpc,
          programAddress,
          [this.utfEncoder.encode(VESTING_SCHEDULE_SEED)],
          VESTING_SCHEDULE_ACCOUNT_NAME,
          YieldVaultIDL as Idl,
        ),
        accountReader.fetchAccountInformationByAddressAndSeeds<YieldPool>(
          this.rpc,
          programAddress,
          [this.utfEncoder.encode(YIELD_POOL_SEED)],
          YIELD_POOL_ACCOUNT_NAME,
          YieldVaultIDL as Idl,
        ),
      ])

      if (!vestingSchedule || !yieldPool) {
        throw new Error('Missing vestingSchedule or yieldPool account data')
      }

      const start = vestingSchedule.start_time?.toNumber?.()
      const end = vestingSchedule.end_time?.toNumber?.()
      const vestingAmount = vestingSchedule.vesting_amount?.toNumber?.()
      if (start == null || end == null || vestingAmount == null) {
        throw new Error('Invalid vesting schedule fields')
      }

      const sharesSupply = yieldPool.shares_supply?.toNumber?.()
      const totalAssets = yieldPool.total_assets?.toNumber?.()
      if (sharesSupply == null || totalAssets == null) {
        throw new Error('Invalid vesting schedule fields')
      }

      const lastVestingAmount = vestingAmount
      const vestingDuration = end - start
      const vestingEnd = end

      const now = Math.floor(providerDataRequestedUnixMs / 1000)

      // Calculate the unvested amount based on the current time
      const unvestedAmount = (lastVestingAmount * Math.max(0, vestingEnd - now)) / vestingDuration

      // Calculate the EUSX price
      const result = this.calcEusxPrice(sharesSupply, totalAssets - unvestedAmount)

      return {
        data: {
          result,
          vestingSchedule: {
            start,
            end,
            vestingAmount,
          },
          unvestedAmount,
          yieldPool: {
            sharesSupply,
            totalAssets,
          },
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (err) {
      const errorMsg = `Failed to calculate EUSX price: ${err}`
      logger.error(errorMsg)
      throw new Error(errorMsg)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: EUSXPriceTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const eUSXPriceTransport = new EUSXPriceTransport()
