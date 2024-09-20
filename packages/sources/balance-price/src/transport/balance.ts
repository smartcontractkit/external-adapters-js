import { ethers, utils, BigNumber } from 'ethers'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'

const { formatEther } = utils

type RequestParams = typeof inputParameters.validated

export class BalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
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

  private async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const { addresses, blockNumber } = param

    const balances = await this._getBalances(addresses, blockNumber)
    const balanceSum = balances.reduce((acc, { balance }) => acc.add(balance), BigNumber.from(0))
    const resultData = balances.map(({ address, balance }) => ({
      address,
      balance: formatEther(balance),
    }))
    const result = formatEther(balanceSum)

    return {
      data: {
        result: resultData,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private _getBalance(address: string, blockNumber: number | undefined) {
    return this.provider.getBalance(address, blockNumber || 'latest')
  }

  private async _getBalances(
    addresses: Array<{ address: string }>,
    blockNumber: number | undefined,
  ) {
    return Promise.all(
      addresses.map(async ({ address }) => {
        const balance = await this._getBalance(address, blockNumber)
        return { address, balance }
      }),
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new BalanceTransport()
