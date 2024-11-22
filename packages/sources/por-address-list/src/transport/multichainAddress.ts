import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import ABI from '../config/PoRAddressListMulti.json'
import PolygonABI from '../config/MultiEVMPoRAddressList.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/multichainAddress'
import { ethers } from 'ethers'
import { fetchAddressList, addProvider, getProvider } from './utils'

export type AddressTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

interface ResponseSchema {
  tokenSymbol: string
  chain: string
  chainId: number
  tokenAddress: string
  vaultAddress: string
}

export class AddressTransport extends SubscriptionTransport<AddressTransportTypes> {
  providersMap: Record<string, ethers.providers.JsonRpcProvider> = {}
  settings!: AddressTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<AddressTransportTypes>,
    adapterSettings: AddressTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
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
    const { confirmations, contractAddress, contractAddressNetwork, batchSize } = param

    this.providersMap = addProvider(contractAddressNetwork, this.providersMap)
    const provider = getProvider(contractAddressNetwork, this.providersMap)

    const addressManager = new ethers.Contract(
      contractAddress,
      contractAddressNetwork.toUpperCase() == 'POLYGON' ? PolygonABI : ABI,
      provider,
    )
    const latestBlockNum = await provider.getBlockNumber()

    const providerDataRequestedUnixMs = Date.now()
    const addressList = await fetchAddressList<ResponseSchema>(
      addressManager,
      latestBlockNum,
      confirmations,
      batchSize,
      this.settings.GROUP_SIZE,
    )

    let response
    switch (param.type) {
      case 'tokens':
        response = buildTokenResponse(addressList, param.vaultPlaceHolder)
        break
      case 'vault':
        response = buildValutResponse(addressList, param.vaultPlaceHolder)
    }

    return {
      data: {
        result: response,
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

const buildTokenResponse = (addressList: ResponseSchema[], vaultPlaceHolder?: string) => {
  const addressByChain = Map.groupBy(
    addressList.filter((addr) => addr.tokenAddress != vaultPlaceHolder),
    (address) => address.chainId.toString() + address.tokenAddress,
  )

  return Array.from(
    new Map(
      Array.from(addressByChain, ([k, v]) => [
        k,
        {
          chainId: v[0].chainId.toString(),
          contractAddress: v[0].tokenAddress,
          wallets: v.map((v) => v.vaultAddress),
        },
      ]),
    ).values(),
  ).sort()
}

const buildValutResponse = (addressList: ResponseSchema[], vaultPlaceHolder?: string) => {
  return addressList
    .filter((addr) => addr.tokenAddress == vaultPlaceHolder)
    .map((addr) => ({
      address: addr.vaultAddress,
      network: addr.chain,
      chainId: addr.chainId.toString(),
    }))
    .sort()
}

export const addressTransport = new AddressTransport()
