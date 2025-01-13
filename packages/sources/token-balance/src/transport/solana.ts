import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solana'
import * as solanaWeb3 from '@solana/web3.js'

const logger = makeLogger('Token Balances - Solana')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

export class SolanaBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  connection!: solanaWeb3.Connection

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    if (!adapterSettings.SOLANA_RPC_URL || adapterSettings.SOLANA_RPC_URL == 'https://TODO') {
      logger.error('SOLANA_RPC_URL is missing')
    } else {
      this.connection = new solanaWeb3.Connection(
        adapterSettings.SOLANA_RPC_URL,
        adapterSettings.SOLANA_COMMITMENT as solanaWeb3.Commitment,
      )
    }

    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
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
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    if (!this.connection) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'SOLANA_RPC_URL is missing',
      })
    }

    const providerDataRequestedUnixMs = Date.now()

    const response = await Promise.all(
      param.addresses
        .filter((a) => a.network?.toLowerCase() == 'solana')
        .flatMap((a) =>
          a.wallets.map((wallet) => ({
            token: new solanaWeb3.PublicKey(a.contractAddress),
            wallet: new solanaWeb3.PublicKey(wallet),
          })),
        )
        .map(async (a) =>
          this.connection.getParsedTokenAccountsByOwner(a.wallet, {
            mint: a.token,
          }),
        ),
    )

    const result = response
      .flatMap((r) => r.value)
      .map((v) => ({
        value: BigInt(v.account.data.parsed.info.tokenAmount.amount),
        decimals: Number(v.account.data.parsed.info.tokenAmount.decimals),
      }))
      .reduce((accumulator, current) => {
        if (current.decimals <= RESULT_DECIMALS) {
          return (
            accumulator +
            BigInt(current.value) * BigInt(Math.pow(10, RESULT_DECIMALS - current.decimals))
          )
        } else {
          return (
            accumulator +
            BigInt(current.value) / BigInt(Math.pow(10, current.decimals - RESULT_DECIMALS))
          )
        }
      }, BigInt(0))

    const formattedResponse = response
      .flatMap((r) => r.value)
      .map((r) => ({
        token: r.account.data.parsed.info.mint,
        wallet: r.account.data.parsed.info.owner,
        value: r.account.data.parsed.info.tokenAmount.amount,
        decimals: r.account.data.parsed.info.tokenAmount.decimals,
      }))

    return {
      data: {
        result: String(result),
        decimals: RESULT_DECIMALS,
        wallets: formattedResponse,
      },
      statusCode: 200,
      result: String(result),
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

export const solanaBalanceTransport = new SolanaBalanceTransport()
