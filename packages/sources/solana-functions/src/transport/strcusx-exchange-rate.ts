import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterDataProviderError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { BorshAccountsCoder, type Idl } from '@coral-xyz/anchor'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/strcusx-exchange-rate'
import * as StrcusxYieldStrategyIDL from '../idl/strcusx_yield_strategy.json'
import { assertTokenProgramOwner, decodeMintInfo } from '../shared/buffer-layout-accounts'
import {
  applyRateBounds,
  calculateNormalizedRate,
  calculateUnvestedAssets,
  parseRateBounds,
  RESULT_DECIMALS,
} from '../shared/exchange-rate-utils'
import {
  AccountInfo,
  assertOwnerProgram,
  CLOCK_SYSVAR_ADDRESS,
  decodeClockUnixTimestamp,
  derivePda,
  fetchMultipleAccounts,
  getAccountDataBuffer,
  parseSolanaAddress,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StrcusxExchangeRateTransport')

const STRATEGY_NAME_LENGTH = 32

const PDA_SEEDS = {
  CONTROLLER: 'CONTROLLER',
  STRATEGY: 'STRATEGY',
  ACCOUNTING: 'ACCOUNTING',
} as const

const strcusxAccountsCoder = new BorshAccountsCoder(StrcusxYieldStrategyIDL as Idl)

const providerError = (message: string) =>
  new AdapterDataProviderError(
    {
      message,
      statusCode: 502,
    },
    {
      providerDataRequestedUnixMs: 0,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  )

type RequestParams = typeof inputParameters.validated
type Tranche = 'junior' | 'senior'

type Stringable = { toString(): string }

type DecodedControllerState = {
  asset_mint: Stringable
}

type DecodedStrategyState = {
  junior_mint: Stringable
  senior_mint: Stringable
}

type DecodedAccountingState = {
  senior_shares: Stringable
  junior_shares: Stringable
  total_assets: Stringable
  senior_assets: Stringable
  total_vesting_assets: Stringable
  senior_vesting_assets: Stringable
  vesting_start_time: Stringable
  vesting_end_time: Stringable
}

type AccountingState = {
  seniorShares: bigint
  juniorShares: bigint
  totalAssets: bigint
  seniorAssets: bigint
  totalVestingAssets: bigint
  seniorVestingAssets: bigint
  vestingStartTime: bigint
  vestingEndTime: bigint
}

const parseStrategyName = (value: string) => {
  const byteLength = Buffer.byteLength(value)
  if (byteLength === 0 || byteLength > STRATEGY_NAME_LENGTH) {
    throw new AdapterInputError({
      message: `strategyName must be 1-${STRATEGY_NAME_LENGTH} UTF-8 bytes`,
      statusCode: 400,
    })
  }

  return value
}

const toBigint = (value: Stringable) => BigInt(value.toString())

const decodeAnchorAccount = <T>(accountName: string, data: Buffer) =>
  strcusxAccountsCoder.decode(accountName, data) as T

const assertProgramOwner = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
  programAddress: string,
) =>
  assertOwnerProgram(
    accountInfo,
    description,
    [programAddress],
    'the requested yield strategy program',
  )

export const deriveControllerAddress = (programAddress: string) => {
  return derivePda(programAddress, [PDA_SEEDS.CONTROLLER]).then((pda) => pda.toString())
}

export const deriveStrategyAddress = (programAddress: string, strategyName: string) => {
  return derivePda(programAddress, [PDA_SEEDS.STRATEGY, strategyName]).then((pda) => pda.toString())
}

export const deriveAccountingAddress = (programAddress: string, strategyName: string) => {
  return derivePda(programAddress, [PDA_SEEDS.ACCOUNTING, strategyName]).then((pda) =>
    pda.toString(),
  )
}

const decodeControllerState = (data: Buffer) => {
  const decoded = decodeAnchorAccount<DecodedControllerState>('Controller', data)

  return {
    assetMintAddress: decoded.asset_mint.toString(),
  }
}

const decodeStrategyState = (data: Buffer) => {
  const decoded = decodeAnchorAccount<DecodedStrategyState>('Strategy', data)

  return {
    juniorMintAddress: decoded.junior_mint.toString(),
    seniorMintAddress: decoded.senior_mint.toString(),
  }
}

const decodeAccountingState = (data: Buffer): AccountingState => {
  const decoded = decodeAnchorAccount<DecodedAccountingState>('AccountingState', data)

  return {
    seniorShares: toBigint(decoded.senior_shares),
    juniorShares: toBigint(decoded.junior_shares),
    totalAssets: toBigint(decoded.total_assets),
    seniorAssets: toBigint(decoded.senior_assets),
    totalVestingAssets: toBigint(decoded.total_vesting_assets),
    seniorVestingAssets: toBigint(decoded.senior_vesting_assets),
    vestingStartTime: toBigint(decoded.vesting_start_time),
    vestingEndTime: toBigint(decoded.vesting_end_time),
  }
}

const calculateBookValueAssets = (accounting: AccountingState, unixTimestamp: bigint) => {
  if (accounting.seniorVestingAssets > accounting.totalVestingAssets) {
    throw providerError(
      'AccountingState seniorVestingAssets must be less than or equal to totalVestingAssets',
    )
  }

  const unvestedTotalVestingAssets = calculateUnvestedAssets(
    accounting.totalVestingAssets,
    unixTimestamp,
    accounting.vestingStartTime,
    accounting.vestingEndTime,
  )
  const unvestedSeniorVestingAssets = calculateUnvestedAssets(
    accounting.seniorVestingAssets,
    unixTimestamp,
    accounting.vestingStartTime,
    accounting.vestingEndTime,
  )

  if (accounting.totalAssets < unvestedTotalVestingAssets) {
    throw providerError(
      'AccountingState totalAssets must be greater than or equal to unvested totalVestingAssets',
    )
  }
  if (accounting.seniorAssets < unvestedSeniorVestingAssets) {
    throw providerError(
      'AccountingState seniorAssets must be greater than or equal to unvested seniorVestingAssets',
    )
  }

  return {
    totalAssets: accounting.totalAssets - unvestedTotalVestingAssets,
    seniorAssets: accounting.seniorAssets - unvestedSeniorVestingAssets,
  }
}

export class StrcusxExchangeRateTransport extends SubscriptionTransport<BaseEndpointTypes> {
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
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

  async _handleRequest(
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const programAddress = parseSolanaAddress(params.programAddress, 'programAddress').toString()
    const strategyName = parseStrategyName(params.strategyName)
    const tranche = params.tranche as Tranche
    const { minRate, maxRate } = parseRateBounds(params.minRate, params.maxRate)

    const [controllerAddress, strategyAddress, accountingAddress] = await Promise.all([
      deriveControllerAddress(programAddress),
      deriveStrategyAddress(programAddress, strategyName),
      deriveAccountingAddress(programAddress, strategyName),
    ])

    const [controllerAccount, strategyAccount, accountingAccount, clockAccount] =
      await fetchMultipleAccounts(this.rpc, [
        controllerAddress,
        strategyAddress,
        accountingAddress,
        CLOCK_SYSVAR_ADDRESS,
      ])

    assertProgramOwner(
      controllerAccount,
      `Controller account '${controllerAddress}'`,
      programAddress,
    )
    assertProgramOwner(strategyAccount, `Strategy account '${strategyAddress}'`, programAddress)
    assertProgramOwner(
      accountingAccount,
      `Accounting account '${accountingAddress}'`,
      programAddress,
    )

    const controller = decodeControllerState(
      getAccountDataBuffer(controllerAccount, `Controller account '${controllerAddress}'`),
    )
    const strategy = decodeStrategyState(
      getAccountDataBuffer(strategyAccount, `Strategy account '${strategyAddress}'`),
    )
    const accounting = decodeAccountingState(
      getAccountDataBuffer(accountingAccount, `Accounting account '${accountingAddress}'`),
    )

    const trancheMintAddress =
      tranche === 'junior' ? strategy.juniorMintAddress : strategy.seniorMintAddress
    const [assetMintAccount, trancheMintAccount] = await fetchMultipleAccounts(this.rpc, [
      controller.assetMintAddress,
      trancheMintAddress,
    ])

    assertTokenProgramOwner(assetMintAccount, `asset mint '${controller.assetMintAddress}'`)
    assertTokenProgramOwner(trancheMintAccount, `${tranche} mint '${trancheMintAddress}'`)

    const assetMint = decodeMintInfo(
      getAccountDataBuffer(assetMintAccount, `asset mint '${controller.assetMintAddress}'`),
      `asset mint '${controller.assetMintAddress}'`,
    )
    const trancheMint = decodeMintInfo(
      getAccountDataBuffer(trancheMintAccount, `${tranche} mint '${trancheMintAddress}'`),
      `${tranche} mint '${trancheMintAddress}'`,
    )

    const clockUnixTimestamp = decodeClockUnixTimestamp(clockAccount)
    const bookValueAssets = calculateBookValueAssets(accounting, clockUnixTimestamp)

    if (bookValueAssets.totalAssets < bookValueAssets.seniorAssets) {
      throw providerError(
        `AccountingState vested totalAssets must be greater than or equal to vested seniorAssets`,
      )
    }

    const juniorAssets = bookValueAssets.totalAssets - bookValueAssets.seniorAssets
    const trancheAssets = tranche === 'junior' ? juniorAssets : bookValueAssets.seniorAssets
    const trancheShares = tranche === 'junior' ? accounting.juniorShares : accounting.seniorShares
    const selectedComputedRate = calculateNormalizedRate(
      trancheAssets,
      trancheShares,
      assetMint.decimals,
      trancheMint.decimals,
    )

    if (selectedComputedRate === null) {
      throw providerError(`${tranche} tranche shares are zero`)
    }

    const { rate, boundsApplied } = applyRateBounds(selectedComputedRate, minRate, maxRate)
    const result = rate.toString()
    const computedResult = selectedComputedRate.toString()

    return {
      data: {
        result,
        computedResult,
        tranche,
        decimals: RESULT_DECIMALS,
        boundsApplied,
        trancheAssets: trancheAssets.toString(),
        trancheShares: trancheShares.toString(),
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: Number(clockUnixTimestamp * 1000n),
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const strcusxExchangeRateTransport = new StrcusxExchangeRateTransport()
