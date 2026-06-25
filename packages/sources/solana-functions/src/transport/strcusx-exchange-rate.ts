import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterDataProviderError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { getAddressDecoder } from '@solana/addresses'
import * as BufferLayout from '@solana/buffer-layout'
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

type IdlField = {
  name: string
  type: 'u8' | 'u32' | 'u64' | 'u128' | 'pubkey' | { array: ['u8', number] }
}

type StrcusxYieldStrategyIdl = {
  accounts: {
    name: string
    discriminator: number[]
  }[]
  types: {
    name: string
    serialization?: string
    repr?: {
      kind?: string
      packed?: boolean
    }
    type: {
      kind: 'struct'
      fields: IdlField[]
    }
  }[]
}

const strcusxYieldStrategyIdl = StrcusxYieldStrategyIDL as unknown as StrcusxYieldStrategyIdl

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

const getIdlType = (accountName: string) => {
  const idlType = strcusxYieldStrategyIdl.types.find((type) => type.name === accountName)
  if (
    !idlType ||
    idlType.serialization !== 'bytemuck' ||
    idlType.repr?.kind !== 'c' ||
    idlType.repr?.packed !== true
  ) {
    throw new Error(`Expected ${accountName} to be a packed bytemuck account in strcUSX IDL`)
  }

  return idlType
}

const getIdlAccountDiscriminator = (accountName: string) => {
  const idlAccount = strcusxYieldStrategyIdl.accounts.find(
    (account) => account.name === accountName,
  )
  if (!idlAccount || idlAccount.discriminator.length !== ACCOUNT_DISCRIMINATOR_LENGTH) {
    throw new Error(`Expected ${accountName} discriminator in strcUSX IDL`)
  }

  return Buffer.from(idlAccount.discriminator)
}

const getIdlFieldLayout = (field: IdlField): BufferLayout.Layout<unknown> => {
  if (typeof field.type !== 'string') {
    if (field.type.array[0] === 'u8') {
      return BufferLayout.blob(field.type.array[1], field.name)
    }
    throw new Error(`Unsupported strcUSX IDL array field '${field.name}'`)
  }

  switch (field.type) {
    case 'u8':
      return BufferLayout.u8(field.name)
    case 'u32':
      return BufferLayout.u32(field.name)
    case 'u64':
      return BufferLayout.blob(U64_LENGTH, field.name)
    case 'u128':
      return BufferLayout.blob(U128_LENGTH, field.name)
    case 'pubkey':
      return BufferLayout.blob(PUBLIC_KEY_LENGTH, field.name)
  }
}

const buildIdlAccountLayout = <T>(accountName: string): BufferLayout.Layout<T> =>
  BufferLayout.struct<T>([
    BufferLayout.blob(ACCOUNT_DISCRIMINATOR_LENGTH, 'discriminator'),
    ...getIdlType(accountName).type.fields.map(getIdlFieldLayout),
  ] as unknown as BufferLayout.Layout<T[keyof T]>[])

const ACCOUNTING_STATE_DISCRIMINATOR = getIdlAccountDiscriminator('AccountingState')
const CONTROLLER_DISCRIMINATOR = getIdlAccountDiscriminator('Controller')
const STRATEGY_DISCRIMINATOR = getIdlAccountDiscriminator('Strategy')

type ControllerStateLayoutFields = {
  discriminator: Uint8Array
  asset_mint: Uint8Array
  is_paused: number
}

type StrategyStateLayoutFields = {
  discriminator: Uint8Array
  name: Uint8Array
  junior_mint: Uint8Array
  senior_mint: Uint8Array
  asset_vault: Uint8Array
  vesting_vault: Uint8Array
  fee_vault: Uint8Array
  loss_vault: Uint8Array
  status: number
  is_paused: number
}

type AccountingStateLayoutFields = {
  discriminator: Uint8Array
  name: Uint8Array
  senior_shares: Uint8Array
  junior_shares: Uint8Array
  total_assets: Uint8Array
  senior_assets: Uint8Array
  total_vesting_assets: Uint8Array
  senior_vesting_assets: Uint8Array
  vesting_start_time: Uint8Array
  vesting_end_time: Uint8Array
}

const ControllerStateLayout = buildIdlAccountLayout<ControllerStateLayoutFields>('Controller')
const StrategyStateLayout = buildIdlAccountLayout<StrategyStateLayoutFields>('Strategy')
const AccountingStateLayout = buildIdlAccountLayout<AccountingStateLayoutFields>('AccountingState')

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
    assetMintAddress: decodeAddress(decoded.asset_mint),
    isPaused: decoded.is_paused === 1,
  }
}

const decodeStrategyState = (data: Buffer): StrategyState => {
  assertDataLength(data, 'Strategy', StrategyStateLayout.span)
  assertDiscriminator(data, 'Strategy', STRATEGY_DISCRIMINATOR)
  const decoded = StrategyStateLayout.decode(data)

  return {
    name: readPaddedString(decoded.name),
    juniorMintAddress: decodeAddress(decoded.junior_mint),
    seniorMintAddress: decodeAddress(decoded.senior_mint),
    assetVaultAddress: decodeAddress(decoded.asset_vault),
    vestingVaultAddress: decodeAddress(decoded.vesting_vault),
    feeVaultAddress: decodeAddress(decoded.fee_vault),
    lossVaultAddress: decodeAddress(decoded.loss_vault),
    status: decoded.status,
    isPaused: decoded.is_paused === 1,
  }
}

const decodeAccountingState = (data: Buffer): AccountingState => {
  assertDataLength(data, 'AccountingState', AccountingStateLayout.span)
  assertDiscriminator(data, 'AccountingState', ACCOUNTING_STATE_DISCRIMINATOR)
  const decoded = AccountingStateLayout.decode(data)

  return {
    name: readPaddedString(decoded.name),
    seniorShares: readU128LE(decoded.senior_shares),
    juniorShares: readU128LE(decoded.junior_shares),
    totalAssets: readU128LE(decoded.total_assets),
    seniorAssets: readU128LE(decoded.senior_assets),
    totalVestingAssets: readU64LE(decoded.total_vesting_assets),
    seniorVestingAssets: readU64LE(decoded.senior_vesting_assets),
    vestingStartTime: readU64LE(decoded.vesting_start_time),
    vestingEndTime: readU64LE(decoded.vesting_end_time),
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
    unvestedTotalAssets: unvestedTotalVestingAssets,
    unvestedSeniorAssets: unvestedSeniorVestingAssets,
  }
}

const assertAssetMintDecimals = (decimals: number) => {
  if (decimals !== EXPECTED_ASSET_MINT_DECIMALS) {
    throw providerError(
      `Expected asset mint decimals to be ${EXPECTED_ASSET_MINT_DECIMALS}, found ${decimals}`,
    )
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
      throw providerError(
        `AccountingState totalAssets must be greater than or equal to seniorAssets`,
      )
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
      throw providerError(`Expected junior mint supply to equal accounting juniorShares`)
    }
    if (seniorMint.supply !== accounting.seniorShares) {
      throw providerError(`Expected senior mint supply to equal accounting seniorShares`)
    }

    const clockUnixTimestamp = decodeClockUnixTimestamp(clockAccount)
    const bookValueAssets = calculateBookValueAssets(accounting, clockUnixTimestamp)

    if (bookValueAssets.totalAssets < bookValueAssets.seniorAssets) {
      throw providerError(
        `AccountingState vested totalAssets must be greater than or equal to vested seniorAssets`,
      )
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
