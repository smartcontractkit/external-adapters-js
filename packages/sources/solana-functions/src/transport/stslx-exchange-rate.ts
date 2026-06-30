import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { address, getAddressEncoder, type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BaseEndpointTypes, inputParameters } from '../endpoint/stslx-exchange-rate'
import {
  assertTokenProgramOwner,
  decodeMintInfo,
  decodeTokenAccountInfo,
  LEGACY_TOKEN_PROGRAM_ADDRESS,
} from '../shared/buffer-layout-accounts'
import {
  applyRateBounds,
  calculateNormalizedRate,
  RESULT_DECIMALS,
  toRateBounds,
} from '../shared/exchange-rate-utils'
import {
  derivePda,
  fetchMultipleAccounts,
  getAccountDataBuffer,
  parseSolanaAddress,
  providerError,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StslxExchangeRateTransport')

const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
const GLAM_VAULT_SEED = 'vault'
const addressEncoder = getAddressEncoder()

type RequestParams = typeof inputParameters.validated

// Solstice provided the GLAM program/state config. GLAM derives the vault PDA
// from its program, the configured state address, and the "vault" seed.
const deriveVaultAddress = (glamStateAddress: Address, glamProtocolProgramAddress: Address) =>
  derivePda(glamProtocolProgramAddress, [GLAM_VAULT_SEED, addressEncoder.encode(glamStateAddress)])

// The derived SLX ATA assumes SLX is a legacy SPL mint; stSLX is read directly
// and can be owned by either the legacy SPL Token program or Token-2022.
const deriveSlxTokenAccountAddress = (vaultAddress: Address, slxMintAddress: Address) =>
  derivePda(ASSOCIATED_TOKEN_PROGRAM_ADDRESS, [
    addressEncoder.encode(vaultAddress),
    addressEncoder.encode(address(LEGACY_TOKEN_PROGRAM_ADDRESS)),
    addressEncoder.encode(slxMintAddress),
  ])

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
    const slxMintAddress = parseSolanaAddress(params.slxMintAddress, 'slxMintAddress')
    const stslxMintAddress = parseSolanaAddress(params.stslxMintAddress, 'stslxMintAddress')
    const glamStateAddress = parseSolanaAddress(params.glamStateAddress, 'glamStateAddress')
    const glamProtocolProgramAddress = parseSolanaAddress(
      params.glamProtocolProgramAddress,
      'glamProtocolProgramAddress',
    )
    const { minRate, maxRate } = toRateBounds(params.minRate, params.maxRate)
    const vaultAddress = await deriveVaultAddress(glamStateAddress, glamProtocolProgramAddress)
    const slxTokenAccountAddress = await deriveSlxTokenAccountAddress(vaultAddress, slxMintAddress)

    // The stSLX feed reads GLAM vault's canonical SLX ATA as its SLX balance source.
    const [slxMintAccount, stslxMintAccount, slxTokenAccount] = await fetchMultipleAccounts(
      this.rpc,
      [slxMintAddress, stslxMintAddress, slxTokenAccountAddress],
    )

    assertTokenProgramOwner(slxMintAccount, `SLX mint '${slxMintAddress}'`)
    assertTokenProgramOwner(stslxMintAccount, `stSLX mint '${stslxMintAddress}'`)

    const slxMint = decodeMintInfo(
      getAccountDataBuffer(slxMintAccount, `SLX mint '${slxMintAddress}'`),
      `SLX mint '${slxMintAddress}'`,
    )
    const stslxMint = decodeMintInfo(
      getAccountDataBuffer(stslxMintAccount, `stSLX mint '${stslxMintAddress}'`),
      `stSLX mint '${stslxMintAddress}'`,
    )
    const slxToken = decodeTokenAccountInfo(
      getAccountDataBuffer(slxTokenAccount, `SLX token account '${slxTokenAccountAddress}'`),
      `SLX token account '${slxTokenAccountAddress}'`,
    )

    const computedRate = calculateNormalizedRate(
      slxToken.amount,
      stslxMint.supply,
      slxMint.decimals,
      stslxMint.decimals,
    )
    if (computedRate === null) {
      throw providerError(`stSLX mint '${stslxMintAddress}' has zero supply`)
    }

    const { rate, boundsApplied } = applyRateBounds(computedRate, minRate, maxRate)
    const result = rate.toString()
    const computedResult = computedRate.toString()
    if (boundsApplied) {
      logger.warn(
        {
          computedResult,
          result,
          minRate: minRate?.toString(),
          maxRate: maxRate?.toString(),
        },
        'stSLX exchange rate bounds applied',
      )
    }

    return {
      data: {
        result,
        computedResult,
        decimals: RESULT_DECIMALS,
        boundsApplied,
        slxBalance: slxToken.amount.toString(),
        stslxSupply: stslxMint.supply.toString(),
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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const stslxExchangeRateTransport = new StslxExchangeRateTransport()
