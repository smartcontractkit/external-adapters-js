import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { getAddressDecoder } from '@solana/addresses'
import * as BufferLayout from '@solana/buffer-layout'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/strcusx-exchange-rate'
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
  assertAddressMatches,
  assertDataLength,
  assertDiscriminator,
  assertNameMatches,
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

const EXPECTED_ASSET_MINT_DECIMALS = 6
const ACCOUNT_DISCRIMINATOR_LENGTH = 8
const PUBLIC_KEY_LENGTH = 32
const STRATEGY_NAME_LENGTH = 32
const U64_LENGTH = 8
const U128_LENGTH = 16

const PDA_SEEDS = {
  CONTROLLER: 'CONTROLLER',
  STRATEGY: 'STRATEGY',
  ACCOUNTING: 'ACCOUNTING',
  JUNIOR_MINT: 'JUNIOR_MINT',
  SENIOR_MINT: 'SENIOR_MINT',
} as const

const ACCOUNTING_STATE_DISCRIMINATOR = Buffer.from([9, 238, 56, 53, 228, 92, 217, 40])
const CONTROLLER_DISCRIMINATOR = Buffer.from([184, 79, 171, 0, 183, 43, 113, 110])
const STRATEGY_DISCRIMINATOR = Buffer.from([174, 110, 39, 119, 82, 106, 169, 102])

// These named spans mirror the Solstice zero-copy account layout while the official IDL is pending.
const CONTROLLER_RESERVED_BEFORE_ASSET_MINT_LENGTH = 65
const STRATEGY_RESERVED_AFTER_NAME_LENGTH = 7
const STRATEGY_TRAILING_DATA_LENGTH = 96
const ACCOUNTING_RESERVED_AFTER_NAME_LENGTH = 1
const ACCOUNTING_TRAILING_DATA_LENGTH = 48

type ControllerStateLayoutFields = {
  discriminator: Uint8Array
  reservedBeforeAssetMint: Uint8Array
  assetMintAddress: Uint8Array
  isPaused: number
}

type StrategyStateLayoutFields = {
  discriminator: Uint8Array
  name: Uint8Array
  reservedAfterName: Uint8Array
  juniorMintAddress: Uint8Array
  seniorMintAddress: Uint8Array
  assetVaultAddress: Uint8Array
  vestingVaultAddress: Uint8Array
  feeVaultAddress: Uint8Array
  lossVaultAddress: Uint8Array
  status: number
  isPaused: number
  trailingData: Uint8Array
}

type AccountingStateLayoutFields = {
  discriminator: Uint8Array
  name: Uint8Array
  reservedAfterName: Uint8Array
  seniorShares: Uint8Array
  juniorShares: Uint8Array
  totalAssets: Uint8Array
  seniorAssets: Uint8Array
  totalVestingAssets: Uint8Array
  seniorVestingAssets: Uint8Array
  vestingStartTime: Uint8Array
  vestingEndTime: Uint8Array
  trailingData: Uint8Array
}

const ControllerStateLayout = BufferLayout.struct<ControllerStateLayoutFields>([
  BufferLayout.blob(ACCOUNT_DISCRIMINATOR_LENGTH, 'discriminator'),
  BufferLayout.blob(CONTROLLER_RESERVED_BEFORE_ASSET_MINT_LENGTH, 'reservedBeforeAssetMint'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'assetMintAddress'),
  BufferLayout.u8('isPaused'),
])

const StrategyStateLayout = BufferLayout.struct<StrategyStateLayoutFields>([
  BufferLayout.blob(ACCOUNT_DISCRIMINATOR_LENGTH, 'discriminator'),
  BufferLayout.blob(STRATEGY_NAME_LENGTH, 'name'),
  BufferLayout.blob(STRATEGY_RESERVED_AFTER_NAME_LENGTH, 'reservedAfterName'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'juniorMintAddress'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'seniorMintAddress'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'assetVaultAddress'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'vestingVaultAddress'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'feeVaultAddress'),
  BufferLayout.blob(PUBLIC_KEY_LENGTH, 'lossVaultAddress'),
  BufferLayout.u8('status'),
  BufferLayout.u8('isPaused'),
  BufferLayout.blob(STRATEGY_TRAILING_DATA_LENGTH, 'trailingData'),
])

const AccountingStateLayout = BufferLayout.struct<AccountingStateLayoutFields>([
  BufferLayout.blob(ACCOUNT_DISCRIMINATOR_LENGTH, 'discriminator'),
  BufferLayout.blob(STRATEGY_NAME_LENGTH, 'name'),
  BufferLayout.blob(ACCOUNTING_RESERVED_AFTER_NAME_LENGTH, 'reservedAfterName'),
  BufferLayout.blob(U128_LENGTH, 'seniorShares'),
  BufferLayout.blob(U128_LENGTH, 'juniorShares'),
  BufferLayout.blob(U128_LENGTH, 'totalAssets'),
  BufferLayout.blob(U128_LENGTH, 'seniorAssets'),
  BufferLayout.blob(U64_LENGTH, 'totalVestingAssets'),
  BufferLayout.blob(U64_LENGTH, 'seniorVestingAssets'),
  BufferLayout.blob(U64_LENGTH, 'vestingStartTime'),
  BufferLayout.blob(U64_LENGTH, 'vestingEndTime'),
  BufferLayout.blob(ACCOUNTING_TRAILING_DATA_LENGTH, 'trailingData'),
])

const addressDecoder = getAddressDecoder()

type RequestParams = typeof inputParameters.validated
type Tranche = 'junior' | 'senior'

type ControllerState = {
  assetMintAddress: string
  isPaused: boolean
}

type StrategyState = {
  name: string
  juniorMintAddress: string
  seniorMintAddress: string
  assetVaultAddress: string
  vestingVaultAddress: string
  feeVaultAddress: string
  lossVaultAddress: string
  status: number
  isPaused: boolean
}

type AccountingState = {
  name: string
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

const readU128LE = (bytes: Uint8Array) => {
  const data = Buffer.from(bytes)
  return data.readBigUInt64LE(0) + (data.readBigUInt64LE(8) << 64n)
}

const readU64LE = (bytes: Uint8Array) => Buffer.from(bytes).readBigUInt64LE(0)

const decodeAddress = (bytes: Uint8Array) => addressDecoder.decode(bytes).toString()

const readPaddedString = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString('utf8').replace(/\0+$/, '')

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

export const deriveJuniorMintAddress = (programAddress: string, strategyName: string) => {
  return derivePda(programAddress, [PDA_SEEDS.JUNIOR_MINT, strategyName]).then((pda) =>
    pda.toString(),
  )
}

export const deriveSeniorMintAddress = (programAddress: string, strategyName: string) => {
  return derivePda(programAddress, [PDA_SEEDS.SENIOR_MINT, strategyName]).then((pda) =>
    pda.toString(),
  )
}

const decodeControllerState = (data: Buffer): ControllerState => {
  assertDataLength(data, 'Controller', ControllerStateLayout.span)
  assertDiscriminator(data, 'Controller', CONTROLLER_DISCRIMINATOR)
  const decoded = ControllerStateLayout.decode(data)

  return {
    assetMintAddress: decodeAddress(decoded.assetMintAddress),
    isPaused: decoded.isPaused === 1,
  }
}

const decodeStrategyState = (data: Buffer): StrategyState => {
  assertDataLength(data, 'Strategy', StrategyStateLayout.span)
  assertDiscriminator(data, 'Strategy', STRATEGY_DISCRIMINATOR)
  const decoded = StrategyStateLayout.decode(data)

  return {
    name: readPaddedString(decoded.name),
    juniorMintAddress: decodeAddress(decoded.juniorMintAddress),
    seniorMintAddress: decodeAddress(decoded.seniorMintAddress),
    assetVaultAddress: decodeAddress(decoded.assetVaultAddress),
    vestingVaultAddress: decodeAddress(decoded.vestingVaultAddress),
    feeVaultAddress: decodeAddress(decoded.feeVaultAddress),
    lossVaultAddress: decodeAddress(decoded.lossVaultAddress),
    status: decoded.status,
    isPaused: decoded.isPaused === 1,
  }
}

const decodeAccountingState = (data: Buffer): AccountingState => {
  assertDataLength(data, 'AccountingState', AccountingStateLayout.span)
  assertDiscriminator(data, 'AccountingState', ACCOUNTING_STATE_DISCRIMINATOR)
  const decoded = AccountingStateLayout.decode(data)

  return {
    name: readPaddedString(decoded.name),
    seniorShares: readU128LE(decoded.seniorShares),
    juniorShares: readU128LE(decoded.juniorShares),
    totalAssets: readU128LE(decoded.totalAssets),
    seniorAssets: readU128LE(decoded.seniorAssets),
    totalVestingAssets: readU64LE(decoded.totalVestingAssets),
    seniorVestingAssets: readU64LE(decoded.seniorVestingAssets),
    vestingStartTime: readU64LE(decoded.vestingStartTime),
    vestingEndTime: readU64LE(decoded.vestingEndTime),
  }
}

const calculateBookValueAssets = (accounting: AccountingState, unixTimestamp: bigint) => {
  if (accounting.seniorVestingAssets > accounting.totalVestingAssets) {
    throw new AdapterInputError({
      message:
        'AccountingState seniorVestingAssets must be less than or equal to totalVestingAssets',
      statusCode: 500,
    })
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
    throw new AdapterInputError({
      message:
        'AccountingState totalAssets must be greater than or equal to unvested totalVestingAssets',
      statusCode: 500,
    })
  }
  if (accounting.seniorAssets < unvestedSeniorVestingAssets) {
    throw new AdapterInputError({
      message:
        'AccountingState seniorAssets must be greater than or equal to unvested seniorVestingAssets',
      statusCode: 500,
    })
  }

  return {
    totalAssets: accounting.totalAssets - unvestedTotalVestingAssets,
    seniorAssets: accounting.seniorAssets - unvestedSeniorVestingAssets,
    unvestedTotalAssets: unvestedTotalVestingAssets,
    unvestedSeniorAssets: unvestedSeniorVestingAssets,
  }
}

const assertAssetMintDecimals = (decimals: number) => {
  if (decimals !== EXPECTED_ASSET_MINT_DECIMALS) {
    throw new AdapterInputError({
      message: `Expected asset mint decimals to be ${EXPECTED_ASSET_MINT_DECIMALS}, found ${decimals}`,
      statusCode: 500,
    })
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

    const [
      controllerAddress,
      strategyAddress,
      accountingAddress,
      expectedJuniorMintAddress,
      expectedSeniorMintAddress,
    ] = await Promise.all([
      deriveControllerAddress(programAddress),
      deriveStrategyAddress(programAddress, strategyName),
      deriveAccountingAddress(programAddress, strategyName),
      deriveJuniorMintAddress(programAddress, strategyName),
      deriveSeniorMintAddress(programAddress, strategyName),
    ])

    const [
      controllerAccount,
      strategyAccount,
      accountingAccount,
      juniorMintAccount,
      seniorMintAccount,
      clockAccount,
    ] = await fetchMultipleAccounts(this.rpc, [
      controllerAddress,
      strategyAddress,
      accountingAddress,
      expectedJuniorMintAddress,
      expectedSeniorMintAddress,
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

    assertNameMatches(strategy.name, strategyName, 'Strategy')
    assertNameMatches(accounting.name, strategyName, 'AccountingState')
    assertAddressMatches(strategy.juniorMintAddress, expectedJuniorMintAddress, 'junior mint PDA')
    assertAddressMatches(strategy.seniorMintAddress, expectedSeniorMintAddress, 'senior mint PDA')

    if (accounting.totalAssets < accounting.seniorAssets) {
      throw new AdapterInputError({
        message: `AccountingState totalAssets must be greater than or equal to seniorAssets`,
        statusCode: 500,
      })
    }

    const [assetMintAccount] = await fetchMultipleAccounts(this.rpc, [controller.assetMintAddress])

    assertTokenProgramOwner(assetMintAccount, `asset mint '${controller.assetMintAddress}'`)
    assertTokenProgramOwner(juniorMintAccount, `junior mint '${strategy.juniorMintAddress}'`)
    assertTokenProgramOwner(seniorMintAccount, `senior mint '${strategy.seniorMintAddress}'`)

    const assetMint = decodeMintInfo(
      getAccountDataBuffer(assetMintAccount, `asset mint '${controller.assetMintAddress}'`),
      `asset mint '${controller.assetMintAddress}'`,
    )
    assertAssetMintDecimals(assetMint.decimals)
    const juniorMint = decodeMintInfo(
      getAccountDataBuffer(juniorMintAccount, `junior mint '${strategy.juniorMintAddress}'`),
      `junior mint '${strategy.juniorMintAddress}'`,
    )
    const seniorMint = decodeMintInfo(
      getAccountDataBuffer(seniorMintAccount, `senior mint '${strategy.seniorMintAddress}'`),
      `senior mint '${strategy.seniorMintAddress}'`,
    )

    if (juniorMint.supply !== accounting.juniorShares) {
      throw new AdapterInputError({
        message: `Expected junior mint supply to equal accounting juniorShares`,
        statusCode: 500,
      })
    }
    if (seniorMint.supply !== accounting.seniorShares) {
      throw new AdapterInputError({
        message: `Expected senior mint supply to equal accounting seniorShares`,
        statusCode: 500,
      })
    }

    const clockUnixTimestamp = decodeClockUnixTimestamp(clockAccount)
    const bookValueAssets = calculateBookValueAssets(accounting, clockUnixTimestamp)

    if (bookValueAssets.totalAssets < bookValueAssets.seniorAssets) {
      throw new AdapterInputError({
        message: `AccountingState vested totalAssets must be greater than or equal to vested seniorAssets`,
        statusCode: 500,
      })
    }

    const juniorAssets = bookValueAssets.totalAssets - bookValueAssets.seniorAssets
    const juniorComputedRate = calculateNormalizedRate(
      juniorAssets,
      accounting.juniorShares,
      assetMint.decimals,
      juniorMint.decimals,
    )
    const seniorComputedRate = calculateNormalizedRate(
      bookValueAssets.seniorAssets,
      accounting.seniorShares,
      assetMint.decimals,
      seniorMint.decimals,
    )
    const selectedComputedRate = tranche === 'junior' ? juniorComputedRate : seniorComputedRate

    if (selectedComputedRate === null) {
      throw new AdapterInputError({
        message: `${tranche} tranche shares are zero`,
        statusCode: 500,
      })
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
        minRate: minRate.toString(),
        maxRate: maxRate.toString(),
        boundsApplied,
        vestedTotalAssets: bookValueAssets.totalAssets.toString(),
        vestedSeniorAssets: bookValueAssets.seniorAssets.toString(),
        vestedJuniorAssets: juniorAssets.toString(),
        seniorShares: accounting.seniorShares.toString(),
        juniorShares: accounting.juniorShares.toString(),
        unvestedTotalAssets: bookValueAssets.unvestedTotalAssets.toString(),
        unvestedSeniorAssets: bookValueAssets.unvestedSeniorAssets.toString(),
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
