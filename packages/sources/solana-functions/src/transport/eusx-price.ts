import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import * as anchor from '@coral-xyz/anchor'
import * as solanaWeb3 from '@solana/web3.js'

import { BaseEndpointTypes, inputParameters } from '../endpoint/eusx-price'
import * as YieldVaultIDL from '../idl/eusx_yield_vault.json'
import type { YieldVault } from '../types/eusx_yield_vault'

const logger = makeLogger('View Function Solana')

export type SolanaFunctionsTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class SolanaFunctionsTransport extends SubscriptionTransport<SolanaFunctionsTransportTypes> {
  connection?: solanaWeb3.Connection
  provider?: anchor.Provider
  wallet?: anchor.Wallet

  // Get Connection creates or returns an existing Solana connection
  getConnection(): solanaWeb3.Connection {
    if (this.connection) {
      return this.connection
    }
    const rpcUrl = process.env.RPC_URL
    const commitment = process.env.COMMITMENT as solanaWeb3.Commitment
    if (!rpcUrl) throw new Error('RPC_URL not set')
    const connection = new solanaWeb3.Connection(rpcUrl, commitment)
    this.connection = connection
    return connection
  }

  // Get Provider creates or returns an existing Anchor provider
  getProvider(): anchor.Provider {
    if (this.provider) {
      return this.provider
    }
    const wallet = {} as any // Empty wallet for read-only operations
    const provider = new anchor.AnchorProvider(this.getConnection(), wallet, {
      commitment: process.env.COMMITMENT as solanaWeb3.Commitment,
    })
    this.provider = provider
    return provider
  }

  async initialize(
    dependencies: TransportDependencies<SolanaFunctionsTransportTypes>,
    adapterSettings: SolanaFunctionsTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  async backgroundHandler(
    context: EndpointContext<SolanaFunctionsTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<SolanaFunctionsTransportTypes['Response']>
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

  // calcEusxPrice based on gist given from Solstice Labs: https://gist.github.com/Thomas-Solstice/3cdae5b1ebf5d74ea638cd2063a26687
  calcEusxPrice(sharesSupply: number, totalAssets: number): number {
    const numerator = totalAssets + 1
    const denominator = sharesSupply + 1
    return denominator === 0 ? 0 : numerator / denominator
  }

  async _handleRequest(
    _: RequestParams,
  ): Promise<AdapterResponse<SolanaFunctionsTransportTypes['Response']>> {
    const provider = this.getProvider()
    const program = anchor.Program<YieldVault>(YieldVaultIDL, provider)

    const [vestingSchedulePda] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from('VESTING_SCHEDULE')],
      program.programId,
    )
    const [yieldPoolPda] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from('YIELD_POOL')],
      program.programId,
    )

    const yieldPool = await program.account.yieldPool.fetch(yieldPoolPda)
    const vestingSchedule = await program.account.vestingSchedule.fetch(vestingSchedulePda)

    const lastVestingAmount = vestingSchedule.vestingAmount.toNumber()
    const vestingDuration =
      vestingSchedule.endTime.toNumber() - vestingSchedule.startTime.toNumber()
    const vestingEnd = vestingSchedule.endTime.toNumber()

    const now = Math.floor(Date.now() / 1000)

    // Calculate the unvested amount based on the current time
    const unvestedAmount = (lastVestingAmount * Math.max(0, vestingEnd - now)) / vestingDuration

    // Calculate the EUSX price
    const result = this.calcEusxPrice(
      yieldPool.sharesSupply.toNumber(),
      yieldPool.totalAssets.toNumber() - unvestedAmount,
    )

    return {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataStreamEstablishedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: SolanaFunctionsTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const solanaFunctionsTransport = new SolanaFunctionsTransport()
