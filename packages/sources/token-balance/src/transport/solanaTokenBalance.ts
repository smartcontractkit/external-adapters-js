import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Commitment, Connection } from '@solana/web3.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solanaTokenBalance'
import { getTokenPrice } from './priceFeed'
import { getTokenBalance } from './solana'

const logger = makeLogger('Token Balance - Solana')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

export class SolanaTokenBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  connection!: Connection

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    if (!adapterSettings.SOLANA_RPC_URL) {
      logger.error('SOLANA_RPC_URL is missing')
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
    const addresses = param.addresses
    const tokenMint = param.tokenMint
    const providerDataRequestedUnixMs = Date.now()

    // 1. Fetch token price ONCE from oracle contract
    const tokenPrice = await getTokenPrice({
      priceOracleAddress: param.priceOracle.contractAddress,
      priceOracleNetwork: param.priceOracle.network,
    })

    // 2. Fetch balances for each Solana wallet and calculate their USD value using the SINGLE tokenPrice
    const totalTokenUSD = await this.calculateTokenAumUSD(addresses, tokenMint, tokenPrice)

    // 4. Build adapter response object
    return {
      data: {
        result: String(totalTokenUSD), // formatted as string for API
        decimals: RESULT_DECIMALS, // fixed output decimals
      },
      statusCode: 200,
      result: String(totalTokenUSD),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async calculateTokenAumUSD(
    addresses: typeof inputParameters.validated.addresses,
    tokenMint: typeof inputParameters.validated.tokenMint,
    tokenPrice: { value: bigint; decimal: number },
  ): Promise<bigint> {
    //1. Fetch token balances for the given address on Solana
    const { result: balances } = await getTokenBalance(addresses, tokenMint, this.connection)

    // 2. Multiply Solana token balances by oracle price and normalize decimals to RESULT_DECIMALS
    // let totalAumUSD = BigInt(0)
    // for (const bal of balances) {
    //   // Normalize token balance decimals to RESULT_DECIMALS
    //   const normalizedAum = bal.value * BigInt(10 ** (RESULT_DECIMALS - bal.decimals))

    //   // Multiply balance by oracle price and normalize again
    //   totalAumUSD +=
    //     (normalizedAum * tokenPrice.value * BigInt(10 ** (RESULT_DECIMALS - tokenPrice.decimal))) /
    //     BigInt(10 ** RESULT_DECIMALS)
    // }

    // 1. Sum raw balances (all balances are for the same mint, so same decimals)
    let totalRaw = BigInt(0)
    let tokenDecimals = 0

    for (const bal of balances) {
      totalRaw += bal.value
      tokenDecimals = bal.decimals // safe because same token
    }

    // 2. Normalize once to RESULT_DECIMALS
    const normalizedBalance = totalRaw * BigInt(10 ** (RESULT_DECIMALS - tokenDecimals))

    // 3. Multiply by oracle price (which has its own decimals)
    const totalAumUSD =
      (normalizedBalance *
        tokenPrice.value *
        BigInt(10 ** (RESULT_DECIMALS - tokenPrice.decimal))) /
      BigInt(10 ** RESULT_DECIMALS)

    // 3. Return total USD value for this address
    return totalAumUSD
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const solanaTokenBalanceTransport = new SolanaTokenBalanceTransport()
