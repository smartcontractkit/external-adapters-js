import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['price', 'stock']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['asset', 'from', 'symbol'],
    type: 'string',
    description:
      'The symbol of the currency to query taken from [here](https://eodhistoricaldata.com/financial-apis/category/data-feeds/)',
  },
}

const commonKeys: { [key: string]: string } = {
  N225: 'N225.INDX',
  FTSE: 'FTSE.INDX',
  BZ: 'BZ.COMM',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `/api/real-time/${symbol}`

  const params = {
    ...config.api.params,
    fmt: 'json',
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['close'])

  return Requester.success(jobRunID, response, config.verbose)
}
