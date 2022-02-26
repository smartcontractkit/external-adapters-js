import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { makeMiddleware, Validator, Requester, withMiddleware } from '@chainlink/ea-bootstrap'
import * as SA from '@chainlink/uniswap-v2-adapter'
import { Config } from '../config'
import { BigNumber } from 'ethers'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['price']

export function getFees(context: AdapterContext, id: string): Promise<BigNumber[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'fees',
      maxAge: 60 * 1000, // 1 minute
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

export const inputParameters: InputParameters = {
  side: {
    required: true,
    description: 'Side of the trade to be evaluated',
    options: ['buy', 'sell'],
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const _config = SA.makeConfig()
  const _execute = SA.makeExecute(_config)

  const jobRunID = validator.validated.jobRunID

  const [mintFee, randomRedeemFee]: BigNumber[] = await getFees(context, jobRunID)

  const isBuy = validator.validated.side === 'buy'
  const pricePayload = {
    from: isBuy ? config.tokenAddress : 'WETH',
    to: isBuy ? 'WETH' : config.tokenAddress,
  }
  const priceResponse = await _execute({ id: jobRunID, data: pricePayload }, context)
  const price = BigNumber.from(priceResponse.data.result)
  const one = BigNumber.from(1)

  const priceWithFees = isBuy ? price.mul(one.add(randomRedeemFee)) : price.mul(one.sub(mintFee))
  const response = { data: priceWithFees }

  return Requester.success(jobRunID, response, _config.verbose)
}
