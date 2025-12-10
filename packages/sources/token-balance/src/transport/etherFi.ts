import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import EigenPodManager from '../config/EigenPodManager.json'
import SplitMain from '../config/SplitMain.json'
import StrategyBaseTVLLimits from '../config/StrategyBaseTVLLimits.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/etherFi'

const logger = makeLogger('Token Balances - EtherFi')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

export class EtherFiBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    if (!adapterSettings.ETHEREUM_RPC_URL) {
      logger.error('ETHEREUM_RPC_URL is missing')
    } else {
      this.provider = new ethers.JsonRpcProvider(
        adapterSettings.ETHEREUM_RPC_URL,
        adapterSettings.ETHEREUM_RPC_CHAIN_ID,
      )
    }

    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
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
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const splitMainContract = new ethers.Contract(param.splitMain, SplitMain, this.provider)
    const splitMainBalance = BigInt(await splitMainContract.getETHBalance(param.splitMainAccount))

    const eigenContract = new ethers.Contract(
      param.eigenStrategy,
      StrategyBaseTVLLimits,
      this.provider,
    )
    const shares = await eigenContract.shares(param.eigenStrategyUser)

    const eigenPodManagerContract = new ethers.Contract(
      context.adapterSettings.EIGENPOD_MANAGER_ADDRESS,
      EigenPodManager,
      this.provider,
    )
    const { shares: queuedWithdrawalShares } = await eigenPodManagerContract.getQueuedWithdrawals(
      param.eigenStrategyUser,
    )

    const queuedSharesTotal = queuedWithdrawalShares?.reduce(
      (acc: bigint, sharesForWithdrawal: bigint[]) => {
        if (!sharesForWithdrawal || sharesForWithdrawal.length === 0) {
          return acc
        }

        return (
          acc + sharesForWithdrawal.reduce((innerAcc: bigint, val: bigint) => innerAcc + val, 0n)
        )
      },
      0n,
    )

    const totalShares = shares + (queuedSharesTotal ?? 0n)
    const eigenBalance = await eigenContract.sharesToUnderlyingView(totalShares)

    return {
      data: {
        result: String(splitMainBalance + eigenBalance),
        decimals: RESULT_DECIMALS,
      },
      statusCode: 200,
      result: String(splitMainBalance + eigenBalance),
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

export const etherFiBalanceTransport = new EtherFiBalanceTransport()
