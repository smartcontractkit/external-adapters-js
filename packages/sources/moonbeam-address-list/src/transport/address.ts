import { config } from '../config'
import { MoonbeamAddressContract_ABI } from '../config/MoonbeamAddressContractABI'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { encodeAddress } from '@polkadot/keyring'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const networkChainMap: NetworkChainMap = {
  moonbeam: {
    mainnet: '0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108',
    testnet: '',
  },
}

export class AddressTransport implements Transport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    _: typeof config.settings,
    __: string,
    name: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = name
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const provider = new ethers.providers.JsonRpcProvider(settings.RPC_URL, settings.CHAIN_ID)
    const contractAddress =
      req.requestContext.data.contractAddress ||
      networkChainMap[req.requestContext.data.network][req.requestContext.data.chainId]
    const addressManager = new ethers.Contract(
      contractAddress,
      MoonbeamAddressContract_ABI,
      provider,
    )

    const providerDataRequestedUnixMs = Date.now()
    const publicKeyAddresses: string[] = await addressManager.getStashAccounts()
    const providerDataReceivedUnixMs = Date.now()

    const result: PoRAddress[] = []
    publicKeyAddresses.forEach((publicKey) => {
      result.push({
        address: encodeAddress(publicKey, 0),
        network: req.requestContext.data.network,
        chainId: req.requestContext.data.chainId,
      })
    })

    const response = {
      data: {
        result,
      },
      result: null,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [{ params: req.requestContext.data, response }])
    return response
  }
}
