import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/stslx-exchange-rate'
import {
  decodeMintInfo,
  decodeTokenAccountInfo,
  LEGACY_TOKEN_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESSES,
} from '../shared/buffer-layout-accounts'
import {
  applyRateBounds,
  calculateNormalizedRate,
  parseRateBounds,
  RESULT_DECIMALS,
} from '../shared/exchange-rate-utils'
import {
  assertOwnerProgram,
  fetchMultipleAccounts,
  getAccountDataBuffer,
} from '../shared/solana-account-utils'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('StslxExchangeRateTransport')

export const GLAM_STATE_ADDRESS = '5E2scHi8LyZAqZeVHnXLeFhwoePxD2CTdSruWmjgVEoB'
export const GLAM_PROTOCOL_PROGRAM_ADDRESS = 'GLAMpaME8wdTEzxtiYEAa5yD8fZbxZiz2hNtV58RZiEz'
export const SLX_MINT_ADDRESS = 'SLXdx4BUt2v9uJQNzWqSfzTJ9UKLUDsvxHFMEEdrfgq'
export const STSLX_MINT_ADDRESS = 'GxHksENo754dKj6kv5d2z7ey9KwE7YSRYgRCtoFYd2yq'
export const GLAM_VAULT_ADDRESS = 'GMwdh2jTdTrrhA7dMR7Cc2zC6gV38UePzAXeoFHrXnfH'
export const SLX_TOKEN_ACCOUNT_ADDRESS = '7CssRFNePpnDiCzjRC5kPRDpEJn87JMeDG7s6Gww9CTf'

type RequestParams = typeof inputParameters.validated

export const deriveVaultAddress = (glamStateAddress = GLAM_STATE_ADDRESS) => {
  const [vaultAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), new PublicKey(glamStateAddress).toBuffer()],
    new PublicKey(GLAM_PROTOCOL_PROGRAM_ADDRESS),
  )

  return vaultAddress.toBase58()
}

export const deriveSlxTokenAccountAddress = (vaultAddress = GLAM_VAULT_ADDRESS) =>
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
    const { minRate, maxRate } = parseRateBounds(params.minRate, params.maxRate)

    // The stSLX feed reads GLAM vault's canonical SLX ATA as its SLX balance source.
    const [slxMintAccount, stslxMintAccount, slxTokenAccount] = await fetchMultipleAccounts(
      this.rpc,
      [SLX_MINT_ADDRESS, STSLX_MINT_ADDRESS, SLX_TOKEN_ACCOUNT_ADDRESS],
    )

    assertOwnerProgram(
      slxMintAccount,
      `SLX mint '${SLX_MINT_ADDRESS}'`,
      TOKEN_PROGRAM_ADDRESSES,
      'a supported token program',
    )
    assertOwnerProgram(
      stslxMintAccount,
      `stSLX mint '${STSLX_MINT_ADDRESS}'`,
      TOKEN_PROGRAM_ADDRESSES,
      'a supported token program',
    )
    assertOwnerProgram(
      slxTokenAccount,
      `SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}'`,
      [LEGACY_TOKEN_PROGRAM_ADDRESS],
      'the legacy SPL Token program',
    )

    const slxMint = decodeMintInfo(
      getAccountDataBuffer(slxMintAccount, `SLX mint '${SLX_MINT_ADDRESS}'`),
      `SLX mint '${SLX_MINT_ADDRESS}'`,
    )
    const stslxMint = decodeMintInfo(
      getAccountDataBuffer(stslxMintAccount, `stSLX mint '${STSLX_MINT_ADDRESS}'`),
      `stSLX mint '${STSLX_MINT_ADDRESS}'`,
    )
    const slxToken = decodeTokenAccountInfo(
      getAccountDataBuffer(slxTokenAccount, `SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}'`),
      `SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}'`,
    )

    if (slxToken.mintAddress !== SLX_MINT_ADDRESS) {
      throw new AdapterInputError({
        message: `Expected SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}' mint to be '${SLX_MINT_ADDRESS}', found '${slxToken.mintAddress}'`,
        statusCode: 500,
      })
    }
    if (slxToken.ownerAddress !== GLAM_VAULT_ADDRESS) {
      throw new AdapterInputError({
        message: `Expected SLX token account '${SLX_TOKEN_ACCOUNT_ADDRESS}' owner to be '${GLAM_VAULT_ADDRESS}', found '${slxToken.ownerAddress}'`,
        statusCode: 500,
      })
    }

    const computedRate = calculateNormalizedRate(
      slxToken.amount,
      stslxMint.supply,
      slxMint.decimals,
      stslxMint.decimals,
    )
    if (computedRate === null) {
      throw new AdapterInputError({
        message: `stSLX mint '${STSLX_MINT_ADDRESS}' has zero supply`,
        statusCode: 500,
      })
    }

    const { rate, boundsApplied } = applyRateBounds(computedRate, minRate, maxRate)
    const result = rate.toString()
    const computedResult = computedRate.toString()

    return {
      data: {
        result,
        computedResult,
        decimals: RESULT_DECIMALS,
        minRate: minRate.toString(),
        maxRate: maxRate.toString(),
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
