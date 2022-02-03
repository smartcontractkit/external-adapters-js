import { AdapterContext, ExecuteWithConfig } from '@chainlink/types'
import { makeMiddleware, Requester, Validator, withMiddleware } from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'
import { Config } from '../config'
import xsushiABI from '../abi/xsushi.json'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['ratio']

export const description = 'Gets the ratio between SUSHI and xSUSHI tokens (with 18 decimals).'

export function getSushiAddress(context: AdapterContext, id: string): Promise<string> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'sushi',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          .then((value) => resolve(value.data))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, {})

  const jobRunID = validator.validated.jobRunID
  const xsushiAddress = config.xsushiAddress
  const sushiAddress = await getSushiAddress(context, jobRunID)

  const xsushi = new ethers.Contract(xsushiAddress, xsushiABI, config.provider)
  const sushi = new ethers.Contract(sushiAddress, xsushiABI, config.provider)
  const balance: ethers.BigNumber = await sushi.balanceOf(xsushiAddress)
  const supply: ethers.BigNumber = await xsushi.totalSupply()
  const pow = BigNumber.from(10).pow(18)
  const ratio = balance.mul(pow).div(supply)

  const response = {
    data: ratio.toString(),
  }

  return Requester.success(jobRunID, response, true)
}
