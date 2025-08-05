import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import ERC20 from '../config/ERC20.json'
import PositionManagerOwnable2StepWithShortcut from '../config/PositionManagerOwnable2StepWithShortcut.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'

const logger = makeLogger('CmethTransport')

type RequestParams = typeof inputParameters.validated

type AddressMap = {
  [name: string]: {
    address: string
    used: boolean
    originalName: string
  }
}

// Exported for testing
export type ContractBalanceMap<T> = {
  [tokenContract: string]: {
    [address: string]: T
  }
}

// Exported for testing
export const sumBigints = (bigints: bigint[]): bigint => {
  return bigints.reduce((sum, value) => sum + value)
}

export const contractBalanceMapToString = (
  map: ContractBalanceMap<bigint>,
): ContractBalanceMap<string> => {
  return Object.fromEntries(
    Object.entries(map).map(([tokenContract, balances]) => [
      tokenContract,
      Object.fromEntries(
        Object.entries(balances).map(([address, balance]) => [address, String(balance)]),
      ),
    ]),
  )
}

// Exported for testing
export const createAddressMap = (addresses: RequestParams['addresses']): AddressMap => {
  const map: AddressMap = {}
  for (const entry of addresses) {
    const name = entry.name.toLowerCase()
    if (name in map) {
      throw new AdapterError({
        statusCode: 400,
        message: `Duplicate address name: '${entry.name}'`,
      })
    }
    map[name] = {
      address: entry.address,
      originalName: entry.name,
      used: false,
    }
  }
  return map
}

export class CmethTransport extends SubscriptionTransport<BaseEndpointTypes> {
  ethProvider!: ethers.JsonRpcProvider
  erc20Contracts: Record<string, ethers.Contract> = {}
  positionManagerContracts: Record<string, ethers.Contract> = {}

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)

    this.ethProvider = new ethers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.ETHEREUM_RPC_CHAIN_ID,
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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
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

    const addressMap = createAddressMap(param.addresses)

    const blockHeight = await this.ethProvider.getBlockNumber()

    const [balances, totalLpts, totalSupply] = await Promise.all([
      this.getBalances(param.balanceOf, addressMap, blockHeight),
      this.getTotalLpts(param.getTotalLPT, addressMap, blockHeight),
      this.getTotalSupply(this.getAddress(addressMap, 'cmETH'), blockHeight),
    ])

    const balanceOfSum = Object.values(balances).reduce((sum, contractBalances) => {
      return sum + sumBigints(Object.values(contractBalances))
    }, 0n)
    const getTotalLptSum = Object.values(totalLpts).reduce((sum, value) => sum + value, 0n)
    const totalReserve = balanceOfSum + getTotalLptSum

    this.checkForUnusedAddresses(addressMap)

    const exchangeRate = totalSupply === 0n ? 0 : Number(totalReserve) / Number(totalSupply)

    const result = Math.min(1.0, exchangeRate)

    const response = {
      data: {
        result,
        blockHeight,
        balances: contractBalanceMapToString(balances),
        totalLpts: Object.fromEntries(
          Object.entries(totalLpts).map(([key, value]) => [key, String(value)]),
        ),
        totalReserve: String(totalReserve),
        totalSupply: String(totalSupply),
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    return response
  }

  async getBalances(
    balanceOf: RequestParams['balanceOf'],
    addressMap: AddressMap,
    blockHeight: number,
  ): Promise<ContractBalanceMap<bigint>> {
    const balances: ContractBalanceMap<bigint> = {}
    await Promise.all(
      balanceOf.map(async (entry) => {
        const tokenContractAddress = this.getAddress(addressMap, entry.tokenContract)
        const accountAddress = this.getAddress(addressMap, entry.account)
        const balance = await this.getBalance({ tokenContractAddress, accountAddress, blockHeight })
        balances[entry.tokenContract] ??= {}
        balances[entry.tokenContract][entry.account] = balance
      }),
    )
    return balances
  }

  getBalance({
    tokenContractAddress,
    accountAddress,
    blockHeight,
  }: {
    tokenContractAddress: string
    accountAddress: string
    blockHeight: number
  }): Promise<bigint> {
    return this.getErc20TokenContract(tokenContractAddress).balanceOf(accountAddress, {
      blockTag: blockHeight,
    })
  }

  async getTotalLpts(
    getTotalLPT: RequestParams['getTotalLPT'],
    addressMap: AddressMap,
    blockHeight: number,
  ): Promise<Record<string, bigint>> {
    const lpts: Record<string, bigint> = {}
    await Promise.all(
      getTotalLPT.map(async (contractName) => {
        const contractAddress = this.getAddress(addressMap, contractName)
        lpts[contractName] = await this.getTotalLpt(contractAddress, blockHeight)
      }),
    )
    return lpts
  }

  getTotalLpt(tokenContractAddress: string, blockHeight: number): Promise<bigint> {
    const contract = (this.positionManagerContracts[tokenContractAddress] ??= new ethers.Contract(
      tokenContractAddress,
      PositionManagerOwnable2StepWithShortcut,
      this.ethProvider,
    ))
    return contract.getTotalLPT({ blockTag: blockHeight })
  }

  getTotalSupply(tokenContractAddress: string, blockHeight: number): Promise<bigint> {
    return this.getErc20TokenContract(tokenContractAddress).totalSupply({ blockTag: blockHeight })
  }

  getErc20TokenContract(contractAddress: string): ethers.Contract {
    return (this.erc20Contracts[contractAddress] ??= new ethers.Contract(
      contractAddress,
      ERC20,
      this.ethProvider,
    ))
  }

  getAddress(addressMap: AddressMap, name: string): string {
    const entry = addressMap[name.toLowerCase()]
    if (!entry) {
      throw new AdapterError({
        statusCode: 400,
        message: `Address for '${name}' not found in address map`,
      })
    }
    entry.used = true
    return entry.address
  }

  checkForUnusedAddresses(addressMap: AddressMap): void {
    const unusedAddresses = Object.values(addressMap)
      .filter(({ used }) => !used)
      .map(({ originalName }) => originalName)

    if (unusedAddresses.length > 0) {
      throw new AdapterError({
        statusCode: 400,
        message: `Unused addresses found: '${unusedAddresses.join("', '")}'`,
      })
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new CmethTransport()
