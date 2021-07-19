import { Validator, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Config } from '../config'

export const NAME = 'TVL'

const customParams = {
  pairContractAddress: true,
}

const dxdWethContractAbi = [
   {
      "type":"function",
      "stateMutability":"view",
      "payable":false,
      "outputs":[
         {
            "type":"uint256",
            "name":""
         }
      ],
      "name":"balanceOf",
      "inputs":[
         {
            "type":"address",
            "name":"_owner"
         }
      ],
      "constant":true
   }
]

export const getTokenAllocations = async (request: AdapterRequest, config: Config): Promise<TokenAllocation.types.TokenAllocation[]> => {
   const validator = new Validator(request, customParams)
   if (validator.error) throw validator.error
   const wethContractAddress = config.wethContractAddress
   const { pairContractAddress } = validator.validated.data
   const tvlInWei = await getTvlAtAddressInWei(pairContractAddress, wethContractAddress, config.rpcUrl)
   return [{
      symbol: "WETH",
      balance: tvlInWei.toString(),
      decimals: 18
   }]
}

const getTvlAtAddressInWei = async (pairContractAddress: string, wethContractAddress: string, jsonRpcUrl: string): Promise<BigNumber> => {
   const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
   Logger.info(`Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`)
   const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
   const { _hex: pairBalanceHex } = await contract.balanceOf(pairContractAddress)
   const tvlInWei = BigNumber.from(pairBalanceHex).mul(2)
   return tvlInWei
}