import { AdapterRequest, AdapterResponse, Execute, InputParameters } from '@chainlink/ea-bootstrap'
import { Validator } from '@chainlink/ea-bootstrap'
import { Config, makeConfig, markets } from './config'
import { getMarketStatus, isMarket } from './marketStatus'

export type TInputParameters = {
  market: string
}

const inputParameters: InputParameters<TInputParameters> = {
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: Array.from(markets),
    required: true,
  },
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const market = validator.validated.data.market
  if (!isMarket(market)) {
    throw new Error(`unknown market: ${market}`)
  }

  const marketStatus = await getMarketStatus(input, config, market)

  return {
    jobRunID,
    statusCode: 200,
    result: marketStatus,
    data: {
      result: marketStatus,
      statusCode: 200,
    },
  }
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
