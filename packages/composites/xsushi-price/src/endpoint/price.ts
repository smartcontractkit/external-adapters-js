import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { makeMiddleware, Validator, withMiddleware } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import { Config } from '../config'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['price', 'crypto']

export function getRatio(context: AdapterContext, id: string): Promise<string> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'ratio',
      maxAge: 60 * 1000, // 1 minute
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context).then((value) => resolve(value.data))
      })
      .catch((error) => reject(error))
  })
}

export const inputParameters: InputParameters = {
  from: ['base', 'from', 'coin'],
  // These input params go directly to TA
  quote: ['quote', 'to', 'market'],
  source: false,
  method: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const _config = TA.makeConfig()
  const _execute = TA.makeExecute(_config)

  const jobRunID = validator.validated.jobRunID
  const from = validator.validated.data.from
  if (from.toUpperCase() !== 'XSUSHI') {
    throw new Error(`Cannot convert anything other than xSUSHI: ${from}`)
  }

  const allocations = [
    {
      symbol: 'SUSHI',
      balance: await getRatio(context, jobRunID),
      decimals: 18,
    },
  ]

  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}
