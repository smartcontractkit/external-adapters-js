import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { getRpcLatestAnswer } from "@chainlink/ea-reference-data-reader"
import { JSON_RPC_URL } from '../config'
import { ethers, BigNumber } from 'ethers'

export const NAME = 'TVL'

const customParams = {
  wethContractAddress: true,
  pairContractAddress: true,
  xdaiEthUsdPriceFeedAddress: true,
  shouldReturnInUSD: false
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
   const { pairContractAddress, wethContractAddress, xdaiEthUsdPriceFeedAddress, shouldReturnInUSD } = validator.validated.data
   const tvlInEth = await getTvlAtAddressInETH(pairContractAddress, wethContractAddress)
   const response = {
      data: {
         result: tvlInEth.toString()
      }
   }
   if (shouldReturnInUSD) {
      Logger.info(`Fetching USD/ETH price from XDai price feed address ${xdaiEthUsdPriceFeedAddress}.`)
      // Price feed returns with 8 decimal places
      const USDPerETH = await getRpcLatestAnswer(xdaiEthUsdPriceFeedAddress, 10**8)
      response.data.result = tvlInEth.mul(BigNumber.from(USDPerETH)).toString()
   }
   return Requester.success(jobRunID, response, config.verbose)
}

const getTvlAtAddressInETH = async (pairContractAddress: string, wethContractAddress: string): Promise<BigNumber> => {
   const provider = new ethers.providers.JsonRpcProvider(JSON_RPC_URL)
   Logger.info(`Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`)
   const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
   const { _hex: pairBalanceHex } = await contract.balanceOf(pairContractAddress)
   const tvlInWei = BigNumber.from(pairBalanceHex).mul(BigNumber.from(2))
   return tvlInWei.div(BigNumber.from("10000000000000000000"))
}
