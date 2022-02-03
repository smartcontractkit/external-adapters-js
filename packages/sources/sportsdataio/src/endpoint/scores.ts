import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_SPORT } from '../config'
import { MMA, NFL, NCAA_FB, NBA, MLB } from '../sport'

export const supportedEndpoints = ['scores']

export const inputParameters: InputParameters = {
  sport: {
    required: true,
  },
  endpoint: {
    required: false,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

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
      throw new AdapterError({
        jobRunID,
        message: `Sport ${sport} not supported.`,
        statusCode: 400,
      })
    }
  }
}
