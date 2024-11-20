import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

type RequestParams = typeof inputParameters.validated

interface AddressWithBalance {
  address: string
  balance: string
}

export class BalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      Number(adapterSettings.ETHEREUM_CHAIN_ID),
    )
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

    let targetBlockTag: string | number = 'latest'
    if (param.minConfirmations != 0) {
      const lastBlockNumber = await this.provider.getBlockNumber()
      targetBlockTag = lastBlockNumber - param.minConfirmations
    }

    const balances = await Promise.all(
      param.addresses.map((addr) => getBalance(addr.address, targetBlockTag, this.provider)),
    )

    return {
      data: {
        result: balances,
      },
      statusCode: 200,
      result: null,
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

const getBalance = async (
  address: string,
  targetBlockTag: string | number,
  provider: ethers.JsonRpcProvider,
): Promise<AddressWithBalance> => ({
  address,
  balance: (await provider.getBalance(address, targetBlockTag)).toString(),
})

export const balanceTransport = new BalanceTransport()
