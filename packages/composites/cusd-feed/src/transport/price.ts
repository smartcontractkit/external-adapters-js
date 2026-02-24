import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import Decimal from 'decimal.js'
import { ethers } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('CUSD Feed')

type RequestParams = TypeFromDefinition<BaseEndpointTypes['Parameters']>

Decimal.set({ precision: 36 })

const TOTAL_SUPPLY_ABI = ['function totalSupply() external view returns (uint256)']

/**
 * Calculates the collateralization ratio scaled by 1e18.
 * @param aum - Total AUM as an 18-decimal scaled integer string
 * @param totalSupply - Total supply as an 18-decimal scaled integer string
 * @returns Object with result (scaled by 1e18), and ratio as decimal string
 * @throws Error if totalSupply is zero
 */
export const calculateRatio = (
  aum: string,
  totalSupply: string,
): { result: string; ratio: string } => {
  const aumDecimal = new Decimal(aum)
  const totalSupplyDecimal = new Decimal(totalSupply)

  if (totalSupplyDecimal.isZero()) {
    throw new Error('Total supply is zero, cannot calculate ratio')
  }

  const ratio = aumDecimal.div(totalSupplyDecimal)
  // Scale ratio by 1e18 to return as 18-decimal integer string
  const result = ratio.mul(new Decimal('1e18')).toFixed(0)

  return { result, ratio: ratio.toString() }
}

export const buildPorInputConfig = (settings: BaseEndpointTypes['Settings']) => [
  {
    protocol: 'por_address_list',
    protocolEndpoint: 'openedenAddress',
    contractAddress: settings.POR_ADDRESS_LIST_CONTRACT,
    contractAddressNetwork: 'ETHEREUM',
    type: 'priced',
    abiName: 'MultiEVMPoRAddressList',
    indexer: 'token_balance',
    indexerEndpoint: 'tbill',
    disableDuplicateAddressFiltering: true,
    disableAddressValidation: true,
  },
  {
    protocol: 'por_address_list',
    protocolEndpoint: 'openedenAddress',
    contractAddress: settings.POR_ADDRESS_LIST_CONTRACT,
    contractAddressNetwork: 'ETHEREUM',
    type: 'pegged',
    abiName: 'MultiEVMPoRAddressList',
    indexer: 'token_balance',
    indexerEndpoint: 'evm',
    disableDuplicateAddressFiltering: true,
    disableAddressValidation: true,
  },
  {
    protocol: 'list',
    addresses: [''],
    indexer: 'view_function_multi_chain',
    indexerEndpoint: 'function',
    indexerParams: {
      signature:
        'function totalBorrows(address _asset) external view returns (uint256 totalBorrow)',
      address: settings.CUSD_CONTRACT_ADDRESS,
      network: 'ETHEREUM',
      inputParams: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
    },
    disableDuplicateAddressFiltering: true,
    viewFunctionIndexerResultDecimals: 6,
  },
]

export class CusdFeedTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.provider = new ethers.JsonRpcProvider(
      this.settings.ETHEREUM_RPC_URL,
      this.settings.ETHEREUM_CHAIN_ID,
    )
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
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

  async _handleRequest(): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [aum, totalSupply] = await Promise.all([this.fetchAum(), this.fetchTotalSupply()])

    try {
      const { result, ratio } = calculateRatio(aum, totalSupply)

      return {
        data: {
          result,
          aum,
          totalSupply,
          ratio,
        },
        statusCode: 200,
        result,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (e) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: e instanceof Error ? e.message : 'Calculation error',
        },
        {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  private async fetchAum(): Promise<string> {
    const requestConfig = {
      url: this.settings.PROOF_OF_RESERVES_ADAPTER_URL,
      method: 'POST',
      data: {
        data: {
          endpoint: 'multiReserves',
          input: buildPorInputConfig(this.settings),
          outputDecimals: 18,
        },
      },
    }

    try {
      const response = await this.requester.request<{ result: string }>(
        JSON.stringify(requestConfig),
        requestConfig,
      )
      return response.response.data.result
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Failed to fetch AUM from proof-of-reserves EA: ${errorMessage}`,
        },
        {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  private async fetchTotalSupply(): Promise<string> {
    try {
      const contract = new ethers.Contract(
        this.settings.CUSD_CONTRACT_ADDRESS,
        TOTAL_SUPPLY_ABI,
        this.provider,
      )
      const totalSupply: bigint = await contract.totalSupply()
      return totalSupply.toString()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Failed to fetch totalSupply from cUSD contract: ${errorMessage}`,
        },
        {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const cusdFeedTransport = new CusdFeedTransport()
