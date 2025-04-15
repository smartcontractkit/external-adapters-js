import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { POR_ADDRESS_LIST_ABI } from '../config/PorAddressList'
import LOMBARD_POR_ADDRESS_LIST_ABI from '../config/LombardPorAddressList.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import { ethers } from 'ethers'
import { addProvider, getProvider } from './providerUtils'
import { DefaultAddressManager, LombardAddressManager, AddressManager } from './addressManager'
// test

export type AddressTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class AddressTransport extends SubscriptionTransport<AddressTransportTypes> {
  provider!: ethers.providers.JsonRpcProvider
  providersMap: Record<string, ethers.providers.JsonRpcProvider> = {}
  settings!: AddressTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<AddressTransportTypes>,
    adapterSettings: AddressTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.RPC_URL,
      adapterSettings.CHAIN_ID,
    )
    this.settings = adapterSettings
  }

  async backgroundHandler(
    context: EndpointContext<AddressTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
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

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<AddressTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const {
      confirmations,
      contractAddress,
      contractAddressNetwork,
      batchSize,
      network,
      chainId,
      searchLimboValidators,
      abiName,
    } = param

    this.providersMap = addProvider(contractAddressNetwork, this.providersMap)
    const provider = getProvider(contractAddressNetwork, this.providersMap, this.provider)

    let addressManager: AddressManager<string[] | string[][]>

    if (abiName == 'Lombard') {
      addressManager = new LombardAddressManager(
        contractAddress,
        LOMBARD_POR_ADDRESS_LIST_ABI,
        provider,
      )
    } else {
      addressManager = new DefaultAddressManager(contractAddress, POR_ADDRESS_LIST_ABI, provider)
    }

    const latestBlockNum = await provider.getBlockNumber()

    const addressList = await addressManager.fetchAddressList(
      latestBlockNum,
      confirmations,
      batchSize,
      this.settings.GROUP_SIZE,
    )

    const addresses = addressManager.processPoRAddressList(addressList, network, chainId)

    return {
      data: {
        searchLimboValidators,
        result: addresses,
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

export const addressTransport = new AddressTransport()
