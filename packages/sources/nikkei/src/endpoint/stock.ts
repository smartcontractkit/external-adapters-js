import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['stock', 'price']

const commonKeys: Record<string, string> = {
  N225: 'nk225',
}

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**'

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description:
      'The symbol of the index to query [list](https://indexes.nikkei.co.jp/en/nkave/index)',
    required: true,
  },
}

export interface ResponseSchema {
  price: string
  diff: string
  diff_xs: string
  price_diff: string
  datedtime: string
  datedtime_nkave: string
  open_price: string
  opentime: string
  high_price: string
  hightime: string
  low_price: string
  lowtime: string
  divisor: string
  divisor_date: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

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

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const price = response.data.price.replace(',', '')
  const result = Requester.validateResultNumber({ result: price }, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
