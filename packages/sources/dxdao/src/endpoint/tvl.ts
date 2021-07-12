import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { JSON_RPC_URL } from '../config'
import { ethers } from 'ethers'

export const NAME = 'TVL'

const customParams = {
  wethContractAddress: true,
  pairContractAddress: true
}

const dxdWethContractAbi = [
  {
     "type":"function",
     "stateMutability":"view",
     "payable":false,
     "outputs":[
        {
           "type":"address",
           "name":"impl"
        }
     ],
     "name":"implementation",
     "inputs":[
        
     ],
     "constant":true
  },
  {
     "type":"constructor",
     "stateMutability":"nonpayable",
     "payable":false,
     "inputs":[
        {
           "type":"address",
           "name":"_tokenImage"
        },
        {
           "type":"string",
           "name":"_name"
        },
        {
           "type":"string",
           "name":"_symbol"
        },
        {
           "type":"uint8",
           "name":"_decimals"
        },
        {
           "type":"uint256",
           "name":"_chainId"
        }
     ]
  },
  {
     "type":"fallback",
     "stateMutability":"payable",
     "payable":true
  }
]

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider()
  const pairContractAddress = validator.validated.data.pairContractAddress
  const wethContractAddress = validator.validated.data.wethContractAddress
  const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
  const tvl = await contract.balanceOf(pairContractAddress)
  const response = {
    data: {}
  }
  response.data.result = tvl
  return Requester.success(jobRunID, response, config.verbose)
}
