import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { POR_ADDRESS_LIST_ABI } from '../config/abi'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import { ethers } from 'ethers'
import { fetchAddressList } from './utils'

interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

export type AddressTransportTypes = BaseEndpointTypes

export class AddressTransport implements Transport<AddressTransportTypes> {
  name!: string
  responseCache!: ResponseCache<AddressTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<AddressTransportTypes>,
    _adapterSettings: AddressTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: AddressTransportTypes['Settings'],
  ): Promise<AdapterResponse<AddressTransportTypes['Response']>> {
    const { confirmations, contractAddress, batchSize, network, chainId, searchLimboValidators } =
      req.requestContext.data
    const provider = new ethers.providers.JsonRpcProvider(settings.RPC_URL, settings.CHAIN_ID)
    const addressManager = new ethers.Contract(contractAddress, POR_ADDRESS_LIST_ABI, provider)
    const latestBlockNum = await provider.getBlockNumber()

    const addressList = await fetchAddressList(
      addressManager,
      latestBlockNum,
      confirmations,
      batchSize,
    )
    const addresses: PorInputAddress[] = addressList.map((address) => ({
      address,
      network,
      chainId,
    }))

    const response = {
      data: {
        searchLimboValidators,
        result: addresses,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response,
      },
    ])

    return response
  }
}

export const addressTransport = new AddressTransport()
