import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { encodeAddress } from '@polkadot/keyring'
import { ethers } from 'ethers'
import { MoonbeamAddressContract_ABI } from '../abi/MoonbeamAddressContractABI'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const networks = ['moonbeam']
const chainIds = ['mainnet', 'testnet']

const networkChainMap: NetworkChainMap = {
  moonbeam: {
    mainnet: '0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108',
    testnet: '',
  },
}

const inputParameters = new InputParameters({
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
})

interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

interface ResponseSchema {
  Data: {
    result: PorInputAddress[]
  }
  Result: null
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: ResponseSchema
  Settings: typeof config.settings
}

export class AddressTransport implements Transport<EndpointTypes> {
  name!: string
  responseCache!: ResponseCache<EndpointTypes>

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
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
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
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
    await this.responseCache.write(this.name, [{ params: req.requestContext.data, response }])
    return response
  }
}

export const addressEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'address',
  transport: new AddressTransport(),
  inputParameters,
})
