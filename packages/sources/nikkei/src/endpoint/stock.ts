import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['stock', 'price']

const customError = (data: any) => data.Response === 'Error'

const commonKeys: Record<string, string> = {
  N225: 'nk225',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description:
      'The symbol of the index to query [list](https://indexes.nikkei.co.jp/en/nkave/index)',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const url = `get_real_data`
  let idx = validator.validated.data.base.toUpperCase()

  idx = commonKeys[idx] || idx

  const params = {
    idx,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = parseFloat(response.data.price.replace(',', ''))
  return Requester.success(jobRunID, response, config.verbose)
}
