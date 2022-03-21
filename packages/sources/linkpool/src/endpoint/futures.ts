import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['futures']

export type TInputParameters = { market: string }
export const inputParameters: InputParameters<TInputParameters> = {
  market: {
    aliases: ['from', 'future'],
    required: true,
  },
}

const commonKeys: Record<string, string> = {
  brent: 'BRN',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  let market = validator.validated.data.market.toLowerCase()
  if (market in commonKeys) market = commonKeys[market]

  const url = `/futures/${market.toUpperCase()}/sip62`

  const headers = {
    'x-api-key': util.getRandomRequiredEnv('API_KEY') || '',
  }

  const options: AxiosRequestConfig = {
    ...config.api,
    url,
    headers,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['result'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
