import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import {
  AccountLayout,
  getAssociatedTokenAddressSync,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/stslx-exchange-rate'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StslxExchangeRateTransport')

const RESULT_DECIMALS = 18

// stSLX-specific accounts. The GLAM state is supplied by the request.
const GLAM_PROTOCOL_PROGRAM_ADDRESS = 'GLAMpaME8wdTEzxtiYEAa5yD8fZbxZiz2hNtV58RZiEz'
const SLX_MINT_ADDRESS = 'SLXdx4BUt2v9uJQNzWqSfzTJ9UKLUDsvxHFMEEdrfgq'
const STSLX_MINT_ADDRESS = 'GxHksENo754dKj6kv5d2z7ey9KwE7YSRYgRCtoFYd2yq'
const TOKEN_PROGRAM_ADDRESSES = [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()]

type RequestParams = typeof inputParameters.validated

type EncodedAccountData = readonly [string, string]

type AccountInfo = {
  data?: EncodedAccountData
  owner?: { toString(): string } | string
}

type AccountInfoRpcResponse = {
  value?: AccountInfo | null
}

type DecodedMint = {
  supply: bigint
  decimals: number
}

type DecodedTokenAccount = {
  mint: PublicKey
  owner: PublicKey
  amount: bigint
}

type MintInfo = {
  supply: bigint
  decimals: number
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

const getAccountDataBuffer = (accountInfo: AccountInfo | null | undefined, description: string) => {
  // All account reads request raw base64 data so we can decode integer fields directly.
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

const assertTokenProgramOwner = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
) =>
  assertOwnerProgram(accountInfo, description, TOKEN_PROGRAM_ADDRESSES, 'a supported token program')

const assertLegacyTokenProgramOwner = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
) =>
  assertOwnerProgram(
    accountInfo,
    description,
    [TOKEN_PROGRAM_ID.toBase58()],
    'the legacy SPL Token program',
  )

export const deriveVaultAddress = (glamStateAddress: string) => {
  // GLAM stores token assets in a vault PDA derived from the state account and protocol program.
  const [vaultAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), new PublicKey(glamStateAddress).toBuffer()],
    new PublicKey(GLAM_PROTOCOL_PROGRAM_ADDRESS),
  )

  return vaultAddress.toBase58()
}

export const deriveSlxTokenAccountAddress = (vaultAddress: string) =>
  getAssociatedTokenAddressSync(
    new PublicKey(SLX_MINT_ADDRESS),
    new PublicKey(vaultAddress),
    true,
    TOKEN_PROGRAM_ID,
  ).toBase58()

export class StslxExchangeRateTransport extends SubscriptionTransport<BaseEndpointTypes> {
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
    const glamStateAddress = params.glamStateAddress
    const minRate = parseRateBound(params.minRate, 'minRate')
    const maxRate = parseRateBound(params.maxRate, 'maxRate')
    if (minRate > maxRate) {
      throw new AdapterInputError({
        message: `minRate must be less than or equal to maxRate`,
        statusCode: 400,
      })
    }

    const vaultAddress = deriveVaultAddress(glamStateAddress)
    const slxTokenAccountAddress = deriveSlxTokenAccountAddress(vaultAddress)

    // Compute the rate from raw on-chain state: SLX held in GLAM's base-asset ATA
    // divided by stSLX mint supply, normalized by each mint's native decimals.
    const [slxMint, stslxMint, slxBalance] = await Promise.all([
      this.fetchMintInfo(SLX_MINT_ADDRESS, 'SLX mint'),
      this.fetchMintInfo(STSLX_MINT_ADDRESS, 'stSLX mint'),
      this.fetchBaseAssetBalance(vaultAddress, slxTokenAccountAddress),
    ])

    if (stslxMint.supply === 0n) {
      throw new AdapterInputError({
        message: `stSLX mint '${STSLX_MINT_ADDRESS}' has zero supply`,
        statusCode: 500,
      })
    }

    // Rate is returned as an integer with 18 decimals:
    //   SLX balance / stSLX supply, normalized by each mint's native decimals.
    const computedRate =
      (slxBalance * 10n ** BigInt(RESULT_DECIMALS + stslxMint.decimals)) /
      (stslxMint.supply * 10n ** BigInt(slxMint.decimals))

    // Bounds are an explicit jobspec safeguard against transient RPC/read-skew spikes.
    // The EA is stateless, so it clamps against configured absolute limits instead of a cached rate.
    const rate = computedRate < minRate ? minRate : computedRate > maxRate ? maxRate : computedRate
    const result = rate.toString()
    const computedResult = computedRate.toString()

    return {
      data: {
        result,
        computedResult,
        decimals: RESULT_DECIMALS,
        minRate: minRate.toString(),
        maxRate: maxRate.toString(),
        boundsApplied: result !== computedResult,
        slxBalance: slxBalance.toString(),
        stslxSupply: stslxMint.supply.toString(),
        slxMintDecimals: slxMint.decimals,
        stslxMintDecimals: stslxMint.decimals,
        glamStateAddress,
        vaultAddress,
        slxTokenAccountAddress,
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

  private async fetchMintInfo(mintAddress: string, description: string): Promise<MintInfo> {
    const encoding = 'base64'
    const resp = (await this.rpc
      .getAccountInfo(mintAddress as Address, { encoding })
      .send()) as AccountInfoRpcResponse
    const accountInfo = resp.value
    assertTokenProgramOwner(accountInfo, description)

    // MintLayout gives us the raw SPL mint supply and token decimals without using uiAmount floats.
    const data = getAccountDataBuffer(accountInfo, description)
    if (data.length < MintLayout.span) {
      throw new AdapterInputError({
        message: `Expected ${description} account data to be at least ${MintLayout.span} bytes, found ${data.length}`,
        statusCode: 500,
      })
    }

    const decoded = MintLayout.decode(data) as DecodedMint
    return {
      supply: decoded.supply,
      decimals: decoded.decimals,
    }
  }

  private async fetchBaseAssetBalance(vaultAddress: string, tokenAccountAddress: string) {
    const encoding = 'base64'
    const resp = (await this.rpc
      .getAccountInfo(tokenAccountAddress as Address, { encoding })
      .send()) as AccountInfoRpcResponse
    const accountInfo = resp.value

    const data = getAccountDataBuffer(accountInfo, `SLX token account '${tokenAccountAddress}'`)
    assertLegacyTokenProgramOwner(accountInfo, `SLX token account '${tokenAccountAddress}'`)

    if (data.length < AccountLayout.span) {
      throw new AdapterInputError({
        message: `Expected SLX token account '${tokenAccountAddress}' data to be at least ${AccountLayout.span} bytes, found ${data.length}`,
        statusCode: 500,
      })
    }

    const decoded = AccountLayout.decode(data) as DecodedTokenAccount
    const mintAddress = decoded.mint.toBase58()
    if (mintAddress !== SLX_MINT_ADDRESS) {
      throw new AdapterInputError({
        message: `Expected SLX token account '${tokenAccountAddress}' mint to be '${SLX_MINT_ADDRESS}', found '${mintAddress}'`,
        statusCode: 500,
      })
    }

    const ownerAddress = decoded.owner.toBase58()
    if (ownerAddress !== vaultAddress) {
      throw new AdapterInputError({
        message: `Expected SLX token account '${tokenAccountAddress}' owner to be '${vaultAddress}', found '${ownerAddress}'`,
        statusCode: 500,
      })
    }

    return decoded.amount
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const stslxExchangeRateTransport = new StslxExchangeRateTransport()
