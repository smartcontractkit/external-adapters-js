import { Requester, Validator, Logger, util } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { getRpcLatestAnswer } from "@chainlink/ea-reference-data-reader"
import { ethers, BigNumber } from 'ethers'

export const NAME = 'TVL'

const customParams = {
  wethContractAddress: true,
  pairContractAddress: true,
  xdaiEthUsdPriceFeedAddress: false,
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
   const { pairContractAddress, wethContractAddress, xdaiEthUsdPriceFeedAddress } = validator.validated.data
   const tvlInEth = await getTvlAtAddressInETH(pairContractAddress, wethContractAddress)
   const response = {
      data: {
         result: tvlInEth.toString()
      }
   }
   if (xdaiEthUsdPriceFeedAddress) {
      Logger.info(`Fetching USD/ETH price from XDai price feed address ${xdaiEthUsdPriceFeedAddress}.`)
      // Price feed returns with 8 decimal places
      const USDPerETH = await getRpcLatestAnswer(xdaiEthUsdPriceFeedAddress, 10**8)
      response.data.result = tvlInEth.mul(BigNumber.from(USDPerETH)).toString()
   }
   return Requester.success(jobRunID, response, config.verbose)
}

const getTvlAtAddressInETH = async (pairContractAddress: string, wethContractAddress: string): Promise<BigNumber> => {
   const jsonRpcUrl = util.getRequiredEnv('RPC_URL')
   const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
   Logger.info(`Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`)
   const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
   const { _hex: pairBalanceHex } = await contract.balanceOf(pairContractAddress)
   const tvlInWei = BigNumber.from(pairBalanceHex).mul(BigNumber.from(2))
   return tvlInWei.div(BigNumber.from("10000000000000000000"))
}
