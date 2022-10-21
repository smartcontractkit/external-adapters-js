import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { SWNFTUpgrade_ABI } from '../abi/SWNFTUpgrade'
import { fetchAddressList } from '../utils'

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const swellNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: '0xe0C8df4270F4342132ec333F6048cb703E7A9c77',
    goerli: '0x23e33FC2704Bb332C0410B006e8016E7B99CF70A',
  },
}

export const supportedEndpoints = ['address']

export const description =
  'This EA fetches the list of custodial addresses that hold the funds for a PoR feed'

export type TInputParameters = {
  contractAddress: string
  confirmations?: number
  chainId: string
  network: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
  },
  confirmations: {
    description: 'The number of confirmations to query data from',
    default: 0,
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
    default: 'ethereum',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const {
    confirmations,
    contractAddress: contractAddressOverride,
    chainId,
    network,
  } = validator.validated.data
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const contractAddress = contractAddressOverride || swellNetworkChainMap[network][chainId]
  const addressManager = new ethers.Contract(contractAddress, SWNFTUpgrade_ABI, provider)
  const latestBlockNum = await provider.getBlockNumber()
  const addressList = await fetchAddressList(
    addressManager,
    latestBlockNum,
    network,
    chainId,
    confirmations,
  )

  const result = {
    data: {
      addressList,
      result: addressList,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, config.verbose)
}
