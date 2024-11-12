import { Requester, Validator, AdapterInputError, InputParameters } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_SPORT } from './config'
import { MMA, NFL, NCAA_FB, NBA, MLB } from './sport'

export type TInputParameters = { sport: string }
export const inputParams: InputParameters<TInputParameters> = {
  sport: {
    required: true,
    type: 'string',
    description: 'The sport to use',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const sport = validator.validated.data.sport || DEFAULT_SPORT

  switch (sport.toLowerCase()) {
    case MMA.NAME: {
      return await MMA.execute(request, context, config)
    }
    case NFL.NAME: {
      return await NFL.execute(request, context, config)
    }
    case NCAA_FB.NAME: {
      return await NCAA_FB.execute(request, context, config)
    }
    case NBA.NAME: {
      return await NBA.execute(request, context, config)
    }
    case MLB.NAME: {
      return await MLB.execute(request, context, config)
    }
    default: {
      throw new AdapterInputError({
        jobRunID,
        message: `Sport ${sport} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
