import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { getRpcLatestAnswer } from "@chainlink/ea-reference-data-reader"
import { JSON_RPC_URL } from '../config'
import { ethers, BigNumber } from 'ethers'

export const NAME = 'TVL'

const customParams = {
  wethContractAddress: true,
  pairContractAddress: true,
  xdaiEthUsdPriceFeedAddress: true
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
  const provider = new ethers.providers.JsonRpcProvider(JSON_RPC_URL)
  const pairContractAddress = validator.validated.data.pairContractAddress
  const wethContractAddress = validator.validated.data.wethContractAddress
  const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
  const { _hex: pairBalanceHex } = await contract.balanceOf(pairContractAddress)
  const response = {
    data: {
       result: ""
    }
  }
  const tvlInWei = BigNumber.from(pairBalanceHex).mul(BigNumber.from(2))
  const tvlInEth = tvlInWei.div(BigNumber.from("10000000000000000000"))
  const priceFeedAddress = validator.validated.data.xdaiEthUsdPriceFeedAddress
  const USDPerETH = await getRpcLatestAnswer(priceFeedAddress, 10**8)
  response.data.result = tvlInEth.mul(BigNumber.from(USDPerETH)).toString()
  return Requester.success(jobRunID, response, config.verbose)
}
