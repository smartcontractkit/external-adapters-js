import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import {
  AdapterDataProviderError,
  AdapterInputError,
  makeMiddleware,
  util,
  Validator,
  withMiddleware,
} from '@chainlink/ea-bootstrap'
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
        // TODO: makeExecute return types
        executeWithMiddleware(options as any, context)
          .then((value) => resolve(value.data as any))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

export type TInputParameters = {
  from: string
  quote: string
  source?: string
  method?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  from: {
    required: true,
    aliases: ['base', 'coin'],
    description: 'The symbol of the currency to query',
    default: 'xSUSHI',
  },
  // These input params go directly to TA
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    options: ['BTC', 'ETH', 'USD'],
  },
  source: {
    required: false,
    description: 'The data provider to query. This is required if not specified in config.',
  },
  method: { required: false },
}

export const execute: ExecuteWithConfig<Config> = async (input, context) => {
  const validator = new Validator(input, inputParameters)

  const _config = TA.makeConfig()
  const _execute = TA.makeExecute(_config)

  const jobRunID = validator.validated.id
  const from = validator.validated.data.from
  if (from.toUpperCase() !== 'XSUSHI') {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Cannot convert anything other than xSUSHI: ${from}`,
    })
  }

  const allocations = [
    {
      symbol: 'SUSHI',
      balance: await getRatio(context, jobRunID),
      decimals: 18,
    },
  ]

  try {
    return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
