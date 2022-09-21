import { Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { SWNFTUpgrade_ABI } from '../abi/SWNFTUpgrade'
import { MultiCall_ABI } from '../abi/Multicall'
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

const multicallNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    goerli: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
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
  const dummyPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
  const signer = new ethers.Wallet(dummyPrivateKey, provider)
  const contractAddress = contractAddressOverride || swellNetworkChainMap[network][chainId]
  const addressManager = new ethers.Contract(contractAddress, SWNFTUpgrade_ABI, provider)
  const multicall = new ethers.Contract(
    multicallNetworkChainMap[network][chainId],
    MultiCall_ABI,
    signer,
  )
  const latestBlockNum = await provider.getBlockNumber()
  const addressList = await fetchAddressList(
    addressManager,
    multicall,
    latestBlockNum,
    network,
    chainId,
    confirmations,
  )
  return {
    jobRunID,
    result: addressList,
    data: {
      result: addressList,
      statusCode: 200,
    },
    statusCode: 200,
  }
}
