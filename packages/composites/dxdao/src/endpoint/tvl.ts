import { Requester, Validator, Logger, util } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, AdapterRequest } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const NAME = 'TVL'

const customParams = {
  wethContractAddress: true,
  pairContractAddress: true,
  tokenAllocationSource: false
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

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
   const validator = new Validator(request, customParams)
   if (validator.error) throw validator.error
   const jobRunID = validator.validated.id
   const { pairContractAddress, wethContractAddress, tokenAllocationSource } = validator.validated.data
   const tvlInWei = await getTvlAtAddressInWei(pairContractAddress, wethContractAddress)
   const response = {
      data: {
         result: tvlInWei.toString()
      }
   }
   if (tokenAllocationSource) {
      Logger.info("Fetching USD/ETH price from TokenAllocation adapter")
      // Price feed returns with 8 decimal places
      const USDPerETH = await getEthUsdPrice(request, tvlInWei)
      response.data.result = USDPerETH
   }
   return Requester.success(jobRunID, response, config.verbose)
}

const getTvlAtAddressInWei = async (pairContractAddress: string, wethContractAddress: string): Promise<BigNumber> => {
   const jsonRpcUrl = util.getRequiredEnv('RPC_URL')
   const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
   Logger.info(`Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`)
   const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
   const { _hex: pairBalanceHex } = await contract.balanceOf(pairContractAddress)
   const tvlInWei = BigNumber.from(pairBalanceHex).mul(2)
   return tvlInWei
}

const getEthUsdPrice = async (request: AdapterRequest, balance: BigNumber): Promise<string> => {
   const taExecute = TokenAllocation.makeExecute()
   const taRequest: AdapterRequest = {
      ...request,
      data: {
         source: request.data.tokenAllocationSource,
         allocations: [
            {
               symbol: "WETH",
               balance: balance.toString()
            }
         ]
      }
   }
   const { result } = await taExecute(taRequest)
   return result.toString()
}
