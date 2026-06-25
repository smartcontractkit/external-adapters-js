import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  AdapterDataProviderError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { address, getAddressEncoder } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
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
  parseRateBounds,
  RESULT_DECIMALS,
} from '../shared/exchange-rate-utils'
import {
  assertOwnerProgram,
  derivePda,
  fetchMultipleAccounts,
  getAccountDataBuffer,
  parseSolanaAddress,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StslxExchangeRateTransport')

const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
const GLAM_VAULT_SEED = 'vault'
const addressEncoder = getAddressEncoder()

type RequestParams = typeof inputParameters.validated

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

const asProviderError = <T>(callback: () => T) => {
  try {
    return callback()
  } catch (e: unknown) {
    throw providerError(e instanceof Error ? e.message : 'Unknown provider error')
  }
}

const deriveVaultAddress = (glamStateAddress: string, glamProtocolProgramAddress: string) =>
  derivePda(glamProtocolProgramAddress, [
    GLAM_VAULT_SEED,
    addressEncoder.encode(parseSolanaAddress(glamStateAddress, 'glamStateAddress')),
  ])

const deriveSlxTokenAccountAddress = (vaultAddress: string, slxMintAddress: string) =>
  derivePda(ASSOCIATED_TOKEN_PROGRAM_ADDRESS, [
    addressEncoder.encode(parseSolanaAddress(vaultAddress, 'vaultAddress')),
    addressEncoder.encode(address(LEGACY_TOKEN_PROGRAM_ADDRESS)),
    addressEncoder.encode(parseSolanaAddress(slxMintAddress, 'slxMintAddress')),
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
    const slxMintAddress = parseSolanaAddress(params.slxMintAddress, 'slxMintAddress').toString()
    const stslxMintAddress = parseSolanaAddress(
      params.stslxMintAddress,
      'stslxMintAddress',
    ).toString()
    const glamStateAddress = parseSolanaAddress(
      params.glamStateAddress,
      'glamStateAddress',
    ).toString()
    const glamProtocolProgramAddress = parseSolanaAddress(
      params.glamProtocolProgramAddress,
      'glamProtocolProgramAddress',
    ).toString()
    const { minRate, maxRate } = parseRateBounds(params.minRate, params.maxRate)
    const vaultAddress = await deriveVaultAddress(glamStateAddress, glamProtocolProgramAddress)
    const slxTokenAccountAddress = await deriveSlxTokenAccountAddress(vaultAddress, slxMintAddress)

    // The stSLX feed reads GLAM vault's canonical SLX ATA as its SLX balance source.
    const [slxMintAccount, stslxMintAccount, slxTokenAccount] = await fetchMultipleAccounts(
      this.rpc,
      [slxMintAddress, stslxMintAddress, slxTokenAccountAddress],
    )

    asProviderError(() => assertTokenProgramOwner(slxMintAccount, `SLX mint '${slxMintAddress}'`))
    asProviderError(() =>
      assertTokenProgramOwner(stslxMintAccount, `stSLX mint '${stslxMintAddress}'`),
    )
    asProviderError(() =>
      assertOwnerProgram(
        slxTokenAccount,
        `SLX token account '${slxTokenAccountAddress}'`,
        [LEGACY_TOKEN_PROGRAM_ADDRESS],
        'the legacy SPL Token program',
      ),
    )

    const slxMint = asProviderError(() =>
      decodeMintInfo(
        getAccountDataBuffer(slxMintAccount, `SLX mint '${slxMintAddress}'`),
        `SLX mint '${slxMintAddress}'`,
      ),
    )
    const stslxMint = asProviderError(() =>
      decodeMintInfo(
        getAccountDataBuffer(stslxMintAccount, `stSLX mint '${stslxMintAddress}'`),
        `stSLX mint '${stslxMintAddress}'`,
      ),
    )
    const slxToken = asProviderError(() =>
      decodeTokenAccountInfo(
        getAccountDataBuffer(slxTokenAccount, `SLX token account '${slxTokenAccountAddress}'`),
        `SLX token account '${slxTokenAccountAddress}'`,
      ),
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

    return {
      data: {
        result,
        computedResult,
        decimals: RESULT_DECIMALS,
        boundsApplied,
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
