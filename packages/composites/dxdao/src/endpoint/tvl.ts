import { Validator, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Config } from '../config'

export const NAME = 'TVL'

export const description =
  'This endpoint fetches the TVL(Total Value Locked) inside a pair that is deployed on the XDai chain. The TVL is returned in USD.'

const customParams = {
  pairContractAddress: true,
}

const dxdWethContractAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    payable: false,
    outputs: [
      {
        type: 'uint256',
        name: '',
      },
    ],
    name: 'balanceOf',
    inputs: [
      {
        type: 'address',
        name: '_owner',
      },
    ],
    constant: true,
  },
]

export const getTokenAllocations = async (
  request: AdapterRequest,
  config: Config,
): Promise<TokenAllocation.types.TokenAllocation[]> => {
  const validator = new Validator(request, customParams)

  const wethContractAddress = config.wethContractAddress
  const { pairContractAddress } = validator.validated.data
  const tvlInWei = await getTvlAtAddressInWei(
    pairContractAddress,
    wethContractAddress,
    config.rpcUrl,
  )
  return [
    {
      symbol: 'ETH', // Instead of querying the WETH price, get ETH price
      balance: tvlInWei.toString(),
      decimals: 18,
    },
  ]
}

const getTvlAtAddressInWei = async (
  pairContractAddress: string,
  wethContractAddress: string,
  jsonRpcUrl: string,
): Promise<BigNumber> => {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
  Logger.info(
    `Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`,
  )
  const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
  const tvlInWei = (await contract.balanceOf(pairContractAddress)).mul(2)
  return tvlInWei
}
