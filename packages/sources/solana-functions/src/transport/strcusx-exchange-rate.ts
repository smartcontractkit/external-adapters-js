import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/strcusx-exchange-rate'
import { decodeMintInfo, TOKEN_PROGRAM_ADDRESSES } from '../shared/buffer-layout-accounts'
import {
  applyRateBounds,
  calculateNormalizedRate,
  calculateUnvestedAssets,
  parseRateBounds,
  RESULT_DECIMALS,
} from '../shared/exchange-rate-utils'
import {
  AccountInfo,
  assertDataLength,
  assertDiscriminator,
  assertOwnerProgram,
  fetchMultipleAccounts,
  getAccountDataBuffer,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StrcusxExchangeRateTransport')

const EXPECTED_ASSET_MINT_DECIMALS = 6
const CLOCK_SYSVAR_ADDRESS = 'SysvarC1ock11111111111111111111111111111111'
const CLOCK_ACCOUNT_LENGTH = 40
const CLOCK_UNIX_TIMESTAMP_OFFSET = 32

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

const ACCOUNTING_MIN_LENGTH = 185
const CONTROLLER_MIN_LENGTH = 106
const STRATEGY_MIN_LENGTH = 337
const PUBLIC_KEY_LENGTH = 32
const STRATEGY_NAME_LENGTH = 32

const CONTROLLER_ASSET_MINT_OFFSET = 73
const CONTROLLER_IS_PAUSED_OFFSET = 105

const STRATEGY_NAME_OFFSET = 8
const STRATEGY_JUNIOR_MINT_OFFSET = 47
const STRATEGY_SENIOR_MINT_OFFSET = 79
const STRATEGY_ASSET_VAULT_OFFSET = 111
const STRATEGY_VESTING_VAULT_OFFSET = 143
const STRATEGY_FEE_VAULT_OFFSET = 175
const STRATEGY_LOSS_VAULT_OFFSET = 207
const STRATEGY_STATUS_OFFSET = 239
const STRATEGY_IS_PAUSED_OFFSET = 240

const ACCOUNTING_NAME_OFFSET = 8
const ACCOUNTING_SENIOR_SHARES_OFFSET = 41
const ACCOUNTING_JUNIOR_SHARES_OFFSET = 57
const ACCOUNTING_TOTAL_ASSETS_OFFSET = 73
const ACCOUNTING_SENIOR_ASSETS_OFFSET = 89
const ACCOUNTING_TOTAL_VESTING_ASSETS_OFFSET = 105
const ACCOUNTING_SENIOR_VESTING_ASSETS_OFFSET = 113
const ACCOUNTING_VESTING_START_TIME_OFFSET = 121
const ACCOUNTING_VESTING_END_TIME_OFFSET = 129

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

const parsePublicKey = (value: string, name: string) => {
  try {
    return new PublicKey(value)
  } catch {
    throw new AdapterInputError({
      message: `${name} must be a valid Solana address`,
      statusCode: 400,
    })
  }
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

const readU128LE = (data: Buffer, offset: number) =>
  data.readBigUInt64LE(offset) + (data.readBigUInt64LE(offset + 8) << 64n)

const readU64LE = (data: Buffer, offset: number) => data.readBigUInt64LE(offset)

const readPublicKey = (data: Buffer, offset: number) =>
  new PublicKey(data.subarray(offset, offset + PUBLIC_KEY_LENGTH)).toBase58()

const readPaddedString = (data: Buffer, offset: number, length: number) =>
  data
    .subarray(offset, offset + length)
    .toString('utf8')
    .replace(/\0+$/, '')

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

const assertTokenProgramOwner = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
) =>
  assertOwnerProgram(accountInfo, description, TOKEN_PROGRAM_ADDRESSES, 'a supported token program')

const assertNameMatches = (actualName: string, expectedName: string, description: string) => {
  if (actualName !== expectedName) {
    throw new AdapterInputError({
      message: `Expected ${description} name to be '${expectedName}', found '${actualName}'`,
      statusCode: 500,
    })
  }
}

const assertAddressMatches = (actual: string, expected: string, description: string) => {
  if (actual !== expected) {
    throw new AdapterInputError({
      message: `Expected ${description} to be '${expected}', found '${actual}'`,
      statusCode: 500,
    })
  }
}

export const deriveControllerAddress = (programAddress: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.CONTROLLER)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveStrategyAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.STRATEGY), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveAccountingAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ACCOUNTING), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveJuniorMintAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.JUNIOR_MINT), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveSeniorMintAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.SENIOR_MINT), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

const decodeControllerState = (data: Buffer): ControllerState => {
  assertDataLength(data, 'Controller', CONTROLLER_MIN_LENGTH)
  assertDiscriminator(data, 'Controller', CONTROLLER_DISCRIMINATOR)

  return {
    assetMintAddress: readPublicKey(data, CONTROLLER_ASSET_MINT_OFFSET),
    isPaused: data.readUInt8(CONTROLLER_IS_PAUSED_OFFSET) === 1,
  }
}

const decodeStrategyState = (data: Buffer): StrategyState => {
  assertDataLength(data, 'Strategy', STRATEGY_MIN_LENGTH)
  assertDiscriminator(data, 'Strategy', STRATEGY_DISCRIMINATOR)

  return {
    name: readPaddedString(data, STRATEGY_NAME_OFFSET, STRATEGY_NAME_LENGTH),
    juniorMintAddress: readPublicKey(data, STRATEGY_JUNIOR_MINT_OFFSET),
    seniorMintAddress: readPublicKey(data, STRATEGY_SENIOR_MINT_OFFSET),
    assetVaultAddress: readPublicKey(data, STRATEGY_ASSET_VAULT_OFFSET),
    vestingVaultAddress: readPublicKey(data, STRATEGY_VESTING_VAULT_OFFSET),
    feeVaultAddress: readPublicKey(data, STRATEGY_FEE_VAULT_OFFSET),
    lossVaultAddress: readPublicKey(data, STRATEGY_LOSS_VAULT_OFFSET),
    status: data.readUInt8(STRATEGY_STATUS_OFFSET),
    isPaused: data.readUInt8(STRATEGY_IS_PAUSED_OFFSET) === 1,
  }
}

const decodeAccountingState = (data: Buffer): AccountingState => {
  assertDataLength(data, 'AccountingState', ACCOUNTING_MIN_LENGTH)
  assertDiscriminator(data, 'AccountingState', ACCOUNTING_STATE_DISCRIMINATOR)

  return {
    name: readPaddedString(data, ACCOUNTING_NAME_OFFSET, STRATEGY_NAME_LENGTH),
    seniorShares: readU128LE(data, ACCOUNTING_SENIOR_SHARES_OFFSET),
    juniorShares: readU128LE(data, ACCOUNTING_JUNIOR_SHARES_OFFSET),
    totalAssets: readU128LE(data, ACCOUNTING_TOTAL_ASSETS_OFFSET),
    seniorAssets: readU128LE(data, ACCOUNTING_SENIOR_ASSETS_OFFSET),
    totalVestingAssets: readU64LE(data, ACCOUNTING_TOTAL_VESTING_ASSETS_OFFSET),
    seniorVestingAssets: readU64LE(data, ACCOUNTING_SENIOR_VESTING_ASSETS_OFFSET),
    vestingStartTime: readU64LE(data, ACCOUNTING_VESTING_START_TIME_OFFSET),
    vestingEndTime: readU64LE(data, ACCOUNTING_VESTING_END_TIME_OFFSET),
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

const decodeClockUnixTimestamp = (accountInfo: AccountInfo | null | undefined) => {
  const data = getAccountDataBuffer(accountInfo, `Clock sysvar '${CLOCK_SYSVAR_ADDRESS}'`)
  assertDataLength(data, 'Clock sysvar', CLOCK_ACCOUNT_LENGTH)

  return data.readBigInt64LE(CLOCK_UNIX_TIMESTAMP_OFFSET)
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
    const programAddress = parsePublicKey(params.programAddress, 'programAddress').toBase58()
    const strategyName = parseStrategyName(params.strategyName)
    const tranche = params.tranche as Tranche
    const { minRate, maxRate } = parseRateBounds(params.minRate, params.maxRate)

    const controllerAddress = deriveControllerAddress(programAddress)
    const strategyAddress = deriveStrategyAddress(programAddress, strategyName)
    const accountingAddress = deriveAccountingAddress(programAddress, strategyName)
    const expectedJuniorMintAddress = deriveJuniorMintAddress(programAddress, strategyName)
    const expectedSeniorMintAddress = deriveSeniorMintAddress(programAddress, strategyName)

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
