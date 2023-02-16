import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { ethers } from 'ethers'
import { customSettings } from '../config'
import { MoonbeamAddressContract_ABI } from '../abi/MoonbeamAddressContractABI'
import { encodeAddress } from '@polkadot/keyring'

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const networks = ['moonbeam']
const chainIds = ['mainnet', 'testnet']

const networkChainMap: NetworkChainMap = {
  moonbeam: {
    mainnet: '0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108',
    testnet: '',
  },
}

const inputParameters = {
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'moonbeam',
  },
} as const

interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

interface RequestParams {
  contractAddress: string
  network: string
  chainId: string
}

interface ResponseSchema {
  Data: {
    result: PorInputAddress[]
  }
  Result: null
}

type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: ResponseSchema
  CustomSettings: typeof customSettings
}

export class AddressTransport implements Transport<EndpointTypes> {
  cache!: Cache<AdapterResponse<EndpointTypes['Response']>>
  responseCache!: ResponseCache<{
    Request: EndpointTypes['Request']
    Response: EndpointTypes['Response']
  }>

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<EndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL, config.CHAIN_ID)
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

    const result: PorInputAddress[] = []
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
    await this.cache.set(req.requestContext.cacheKey, response, config.CACHE_MAX_AGE)
    return response
  }
}

export const addressEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'address',
  transport: new AddressTransport(),
  inputParameters,
})
