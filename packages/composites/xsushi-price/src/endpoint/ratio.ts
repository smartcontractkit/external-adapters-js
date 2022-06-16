import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { makeMiddleware, Requester, Validator, withMiddleware, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
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
        // TODO: makeExecute return types
        executeWithMiddleware(options as any, context)
          .then((value) => resolve(value.data as any))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const xsushiAddress = config.xsushiAddress
  const sushiAddress = await getSushiAddress(context, jobRunID)

  const xsushi = new ethers.Contract(xsushiAddress, xsushiABI, config.provider)
  const sushi = new ethers.Contract(sushiAddress, xsushiABI, config.provider)
  let balance: ethers.BigNumber
  let supply: ethers.BigNumber
  try {
    balance = await sushi.balanceOf(xsushiAddress)
    supply = await xsushi.totalSupply()
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'network',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const pow = BigNumber.from(10).pow(18)
  const ratio = balance.mul(pow).div(supply)

  const response = {
    data: ratio.toString(),
  }

  return Requester.success(jobRunID, response, true)
}
