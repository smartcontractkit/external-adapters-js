import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Commitment, Connection } from '@solana/web3.js'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solanaMulti'
import { getTokenPrice } from './priceFeed'
import { getToken } from './solana-utils'

const logger = makeLogger('Token Balances - SolanaMulti')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

export class SolanaMultiTransport extends SubscriptionTransport<BaseEndpointTypes> {
  connection!: Connection
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    if (!adapterSettings.SOLANA_RPC_URL) {
      logger.warn('SOLANA_RPC_URL is missing')
    } else {
      this.connection = new Connection(
        adapterSettings.SOLANA_RPC_URL,
        adapterSettings.SOLANA_COMMITMENT as Commitment,
      )
    }
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
    const { addresses, token, priceOracle } = param
    const providerDataRequestedUnixMs = Date.now()

    const [tokenResponse, tokenPrice] = await Promise.all([
      getToken(addresses, token, this.connection),
      this.getTokenPrice(priceOracle),
    ])

    const maxTokenDecimals = tokenResponse.result.reduce(
      (max, elem) => Math.max(elem.decimals, max),
      0,
    )
    const tokenAmount = tokenResponse.result.reduce(
      (sum, elem) => sum + elem.value * 10n ** BigInt(maxTokenDecimals - elem.decimals),
      0n,
    )

    const result = (
      (tokenAmount * tokenPrice.value * 10n ** BigInt(RESULT_DECIMALS)) /
      10n ** BigInt(maxTokenDecimals + tokenPrice.decimal)
    ).toString()

    return {
      data: {
        result,
        decimals: RESULT_DECIMALS,
        wallets: tokenResponse.formattedResponse,
        tokenPrice: {
          value: String(tokenPrice.value),
          decimals: tokenPrice.decimal,
        },
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

  async getTokenPrice(
    priceOracle:
      | {
          contractAddress: string
          network: string
        }
      | undefined,
  ): Promise<{ value: bigint; decimal: number }> {
    if (priceOracle === undefined) {
      return {
        value: 10n ** BigInt(RESULT_DECIMALS),
        decimal: RESULT_DECIMALS,
      }
    }
    return getTokenPrice({
      priceOracleAddress: priceOracle.contractAddress,
      priceOracleNetwork: priceOracle.network,
    })
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const solanaMultiTransport = new SolanaMultiTransport()
