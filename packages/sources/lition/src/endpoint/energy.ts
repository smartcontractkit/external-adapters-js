import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['energy']

export const description = 'Returns the price in Euros per MWh'

export const inputParameters: InputParameters = {
  source: {
    required: true,
    options: ['1', '2', '3'],
    type: 'string',
    description:
      'The provider to retrieve price data from (1 - `agora-energiewende.de`, 2 - `smard.de`, 3 - `energy-charts.info`)',
  },
  date: {
    required: false,
    type: 'string',
    description:
      'The date to query formatted by `YYYY-MM-DD` (e.g. `2020-10-12`), defaults to current UTC date',
  },
  hour: {
    required: false,
    description: 'The hour to query (`0` to `23`), defaults to current UTC hour',
    type: 'number',
  },
}

export interface ResponseSchema {
  price: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source
  const currentTime = new Date()
  const date = validator.validated.data.date || `${currentTime.toISOString().slice(0, 10)}` // YYYY-MM-DD
  const hour = validator.validated.data.hour || currentTime.getUTCHours()

  const url = util.buildUrlPath('energy/source/:source/date/:date/hour/:hour/', {
    source,
    date,
    hour,
  })

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
