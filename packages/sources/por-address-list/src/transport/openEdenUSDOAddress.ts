import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import OpenEdenUSDOPoRAddressList from '../config/OpenEdenUSDOPoRAddressList.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/openEdenUSDOAddress'
import { ethers } from 'ethers'

export type AddressTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

interface ResponseSchema {
  chain: string
  chainId: number
  tokenSymbol: string
  tokenAddress: string
  tokenDecimals: number
  tokenPriceOracle: string //if there is a Price Oracle contract, else 0x0000000000000000000000000000000000000000
  yourVaultAddress: string
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
    const { contractAddress, contractAddressNetwork } = param
    const providerDataRequestedUnixMs = Date.now()

    // provider
    const networkName = contractAddressNetwork.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_RPC_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]
    const chainId = Number(process.env[chainIdEnvName])
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)

    const contract = new ethers.Contract(contractAddress, OpenEdenUSDOPoRAddressList, provider)
    const endIndex = await contract.getPoRAddressListLength()

    const addressList = await contract.getPoRAddressList(0, endIndex)

    let response
    switch (param.type) {
      case 'evm':
        response = buildEVMResponse(addressList)
        break
      case 'tbill':
        response = buildTBILLResponse(addressList)
    }

    if (response == undefined) {
      throw new Error('No response available')
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

const buildEVMResponse = (addressList: ResponseSchema[]) => {
  return addressList
    .filter((addr) => addr.tokenSymbol == 'USDC' || addr.tokenSymbol == 'BUIDL')
    .map((addr) => ({
      contractAddress: addr.tokenAddress,
      network: addr.chain,
      chainId: addr.chainId.toString(),
      token: addr.tokenSymbol,
      wallets: [addr.yourVaultAddress],
    }))
    .sort()
}

const buildTBILLResponse = (addressList: ResponseSchema[]) => {
  return addressList
    .filter((addr) => addr.tokenSymbol == 'TBILL')
    .map((addr) => ({
      contractAddress: addr.tokenAddress,
      network: addr.chain,
      chainId: addr.chainId.toString(),
      token: addr.tokenSymbol,
      priceOracleAddress: addr.tokenPriceOracle,
    }))
}

export const addressTransport = new AddressTransport()
