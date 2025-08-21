import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Commitment, Connection } from '@solana/web3.js'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solvJlp'
import { getRate } from './priceFeed'
import { getToken } from './solana-utils'

const logger = makeLogger('Token Balances - Solana')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

export class SolvJlpBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  connection!: Connection
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    if (!adapterSettings.SOLANA_RPC_URL) {
      logger.error('SOLANA_RPC_URL is missing')
    } else {
      this.connection = new Connection(
        adapterSettings.SOLANA_RPC_URL,
        adapterSettings.SOLANA_COMMITMENT as Commitment,
      )
    }

    if (!adapterSettings.ARBITRUM_RPC_URL) {
      logger.error('ARBITRUM_RPC_URL is missing')
    } else {
      this.provider = new ethers.JsonRpcProvider(
        adapterSettings.ARBITRUM_RPC_URL,
        adapterSettings.ARBITRUM_RPC_CHAIN_ID,
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
    const providerDataRequestedUnixMs = Date.now()

    const [tokenResponse, jlpUSD, btcUSD] = await Promise.all([
      getToken(param.addresses, 'jlp', this.connection),
      getRate(param.jlpUsdContract, this.provider),
      getRate(param.btcUsdContract, this.provider),
    ])

    const token = tokenResponse.result.reduce((sum, elem) => {
      return sum + elem.value * BigInt(10 ** (RESULT_DECIMALS - elem.decimals))
    }, 0n)

    const usd = token * jlpUSD.value * BigInt(10 ** (RESULT_DECIMALS - jlpUSD.decimal))

    const btc = usd / (btcUSD.value * BigInt(10 ** (RESULT_DECIMALS - btcUSD.decimal)))

    return {
      data: {
        result: String(btc),
        decimals: RESULT_DECIMALS,
        wallets: tokenResponse.formattedResponse,
        jlpUSD: {
          value: String(jlpUSD.value),
          decimals: jlpUSD.decimal,
        },
        btcUSD: {
          value: String(btcUSD.value),
          decimals: btcUSD.decimal,
        },
      },
      statusCode: 200,
      result: String(btc),
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

export const solvJlpBalanceTransport = new SolvJlpBalanceTransport()
