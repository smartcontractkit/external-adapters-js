import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { MintLayout, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/strcusx-exchange-rate'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StrcusxExchangeRateTransport')

const RESULT_DECIMALS = 18
const ASSET_MINT_DECIMALS = 6
const TOKEN_PROGRAM_ADDRESSES = [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()]
const CLOCK_SYSVAR_ADDRESS = 'SysvarC1ock11111111111111111111111111111111'
const CLOCK_ACCOUNT_LENGTH = 40
const CLOCK_UNIX_TIMESTAMP_OFFSET = 32

const ACCOUNTING_STATE_DISCRIMINATOR = Buffer.from([9, 238, 56, 53, 228, 92, 217, 40])
const CONTROLLER_DISCRIMINATOR = Buffer.from([184, 79, 171, 0, 183, 43, 113, 110])
const STRATEGY_DISCRIMINATOR = Buffer.from([174, 110, 39, 119, 82, 106, 169, 102])

const ACCOUNTING_MIN_LENGTH = 185
const CONTROLLER_MIN_LENGTH = 106
const STRATEGY_MIN_LENGTH = 337

type RequestParams = typeof inputParameters.validated
type Tranche = 'junior' | 'senior'

type EncodedAccountData = readonly [string, string]

type AccountInfo = {
  data?: EncodedAccountData
  owner?: { toString(): string } | string
}

type MultipleAccountsRpcResponse = {
  value?: (AccountInfo | null)[]
}

type DecodedMint = {
  supply: bigint
  decimals: number
}

type MintInfo = {
  supply: bigint
  decimals: number
}

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

const parseRateBound = (value: string, name: string) => {
  let parsed: bigint
  try {
    parsed = BigInt(value)
  } catch {
    throw new AdapterInputError({
      message: `${name} must be a positive base-10 integer string`,
      statusCode: 400,
    })
  }

  if (parsed <= 0n || parsed.toString() !== value) {
    throw new AdapterInputError({
      message: `${name} must be a positive base-10 integer string`,
      statusCode: 400,
    })
  }

  return parsed
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
  if (byteLength === 0 || byteLength > 32) {
    throw new AdapterInputError({
      message: 'strategyName must be 1-32 UTF-8 bytes',
      statusCode: 400,
    })
  }

  return value
}

const parseTranche = (value: string): Tranche => {
  if (value === 'junior' || value === 'senior') {
    return value
  }

  throw new AdapterInputError({
    message: "tranche must be either 'junior' or 'senior'",
    statusCode: 400,
  })
}

export const readU128LE = (data: Buffer, offset: number) =>
  data.readBigUInt64LE(offset) + (data.readBigUInt64LE(offset + 8) << 64n)

const readU64LE = (data: Buffer, offset: number) => data.readBigUInt64LE(offset)

const readPublicKey = (data: Buffer, offset: number) =>
  new PublicKey(data.subarray(offset, offset + 32)).toBase58()

const readPaddedString = (data: Buffer, offset: number, length: number) =>
  data
    .subarray(offset, offset + length)
    .toString('utf8')
    .replace(/\0+$/, '')

const assertDataLength = (data: Buffer, description: string, minLength: number) => {
  if (data.length < minLength) {
    throw new AdapterInputError({
      message: `Expected ${description} account data to be at least ${minLength} bytes, found ${data.length}`,
      statusCode: 500,
    })
  }
}

const assertDiscriminator = (data: Buffer, description: string, discriminator: Buffer) => {
  if (!data.subarray(0, discriminator.length).equals(discriminator)) {
    throw new AdapterInputError({
      message: `Expected ${description} discriminator to be ${discriminator.toString(
        'hex',
      )}, found ${data.subarray(0, discriminator.length).toString('hex')}`,
      statusCode: 500,
    })
  }
}

const getAccountDataBuffer = (accountInfo: AccountInfo | null | undefined, description: string) => {
  const encodedData = accountInfo?.data?.[0]
  if (!encodedData) {
    throw new AdapterInputError({
      message: `No account data found for ${description}`,
      statusCode: 500,
    })
  }

  return Buffer.from(encodedData, 'base64')
}

const assertOwnerProgram = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
  expectedOwners: string[],
  ownerDescription: string,
) => {
  const owner = accountInfo?.owner?.toString()
  if (!owner || !expectedOwners.includes(owner)) {
    throw new AdapterInputError({
      message: `Expected ${description} to be owned by ${ownerDescription} [${expectedOwners.join(
        ', ',
      )}], found '${owner}'`,
      statusCode: 500,
    })
  }
}

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
    [Buffer.from('CONTROLLER')],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveStrategyAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from('STRATEGY'), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveAccountingAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from('ACCOUNTING'), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveJuniorMintAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from('JUNIOR_MINT'), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const deriveSeniorMintAddress = (programAddress: string, strategyName: string) => {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from('SENIOR_MINT'), Buffer.from(strategyName)],
    parsePublicKey(programAddress, 'programAddress'),
  )
  return address.toBase58()
}

export const decodeControllerState = (data: Buffer): ControllerState => {
  assertDataLength(data, 'Controller', CONTROLLER_MIN_LENGTH)
  assertDiscriminator(data, 'Controller', CONTROLLER_DISCRIMINATOR)

  return {
    assetMintAddress: readPublicKey(data, 73),
    isPaused: data.readUInt8(105) === 1,
  }
}

export const decodeStrategyState = (data: Buffer): StrategyState => {
  assertDataLength(data, 'Strategy', STRATEGY_MIN_LENGTH)
  assertDiscriminator(data, 'Strategy', STRATEGY_DISCRIMINATOR)

  return {
    name: readPaddedString(data, 8, 32),
    juniorMintAddress: readPublicKey(data, 47),
    seniorMintAddress: readPublicKey(data, 79),
    assetVaultAddress: readPublicKey(data, 111),
    vestingVaultAddress: readPublicKey(data, 143),
    feeVaultAddress: readPublicKey(data, 175),
    lossVaultAddress: readPublicKey(data, 207),
    status: data.readUInt8(239),
    isPaused: data.readUInt8(240) === 1,
  }
}

export const decodeAccountingState = (data: Buffer): AccountingState => {
  assertDataLength(data, 'AccountingState', ACCOUNTING_MIN_LENGTH)
  assertDiscriminator(data, 'AccountingState', ACCOUNTING_STATE_DISCRIMINATOR)

  return {
    name: readPaddedString(data, 8, 32),
    seniorShares: readU128LE(data, 41),
    juniorShares: readU128LE(data, 57),
    totalAssets: readU128LE(data, 73),
    seniorAssets: readU128LE(data, 89),
    totalVestingAssets: readU64LE(data, 105),
    seniorVestingAssets: readU64LE(data, 113),
    vestingStartTime: readU64LE(data, 121),
    vestingEndTime: readU64LE(data, 129),
  }
}

const calculateUnvestedAssets = (
  assets: bigint,
  unixTimestamp: bigint,
  vestingStartTime: bigint,
  vestingEndTime: bigint,
) => {
  if (assets === 0n || vestingEndTime <= vestingStartTime || unixTimestamp >= vestingEndTime) {
    return 0n
  }
  if (unixTimestamp <= vestingStartTime) {
    return assets
  }

  const vestedAssets =
    (assets * (unixTimestamp - vestingStartTime)) / (vestingEndTime - vestingStartTime)
  return assets - vestedAssets
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

const decodeMintInfo = (data: Buffer, description: string): MintInfo => {
  assertDataLength(data, description, MintLayout.span)
  const decoded = MintLayout.decode(data) as DecodedMint
  return {
    supply: decoded.supply,
    decimals: decoded.decimals,
  }
}

const assertAssetMintDecimals = (decimals: number) => {
  if (decimals !== ASSET_MINT_DECIMALS) {
    throw new AdapterInputError({
      message: `Expected asset mint decimals to be ${ASSET_MINT_DECIMALS}, found ${decimals}`,
      statusCode: 500,
    })
  }
}

const calculateRate = (
  assets: bigint,
  shares: bigint,
  assetMintDecimals: number,
  trancheMintDecimals: number,
) => {
  if (shares === 0n) {
    return null
  }

  return (
    (assets * 10n ** BigInt(RESULT_DECIMALS + trancheMintDecimals)) /
    (shares * 10n ** BigInt(assetMintDecimals))
  )
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
    const tranche = parseTranche(params.tranche)
    const minRate = parseRateBound(params.minRate, 'minRate')
    const maxRate = parseRateBound(params.maxRate, 'maxRate')
    if (minRate > maxRate) {
      throw new AdapterInputError({
        message: 'minRate must be less than or equal to maxRate',
        statusCode: 400,
      })
    }

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
    ] = await this.fetchAccounts([
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

    const [assetMintAccount] = await this.fetchAccounts([controller.assetMintAddress])

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
    const juniorComputedRate = calculateRate(
      juniorAssets,
      accounting.juniorShares,
      ASSET_MINT_DECIMALS,
      juniorMint.decimals,
    )
    const seniorComputedRate = calculateRate(
      bookValueAssets.seniorAssets,
      accounting.seniorShares,
      ASSET_MINT_DECIMALS,
      seniorMint.decimals,
    )
    const selectedComputedRate = tranche === 'junior' ? juniorComputedRate : seniorComputedRate

    if (selectedComputedRate === null) {
      throw new AdapterInputError({
        message: `${tranche} tranche shares are zero`,
        statusCode: 500,
      })
    }

    const rate =
      selectedComputedRate < minRate
        ? minRate
        : selectedComputedRate > maxRate
        ? maxRate
        : selectedComputedRate
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
        boundsApplied: result !== computedResult,
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

  private async fetchAccounts(addresses: string[]) {
    const encoding = 'base64'
    const resp = (await this.rpc
      .getMultipleAccounts(addresses as Address[], { encoding })
      .send()) as MultipleAccountsRpcResponse

    if (!resp.value || resp.value.length !== addresses.length) {
      throw new AdapterInputError({
        message: `Expected ${addresses.length} account responses, received ${
          resp.value?.length ?? 0
        }`,
        statusCode: 500,
      })
    }

    return resp.value
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const strcusxExchangeRateTransport = new StrcusxExchangeRateTransport()
