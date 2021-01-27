import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'realData'

const customError = (data: any) => data.Response === 'Error'

const commonKeys: Record<string, string> = {
  N225: 'nk225',
}

const customParams = {
  base: ['base', 'from', 'coin'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const url = `get_real_data`
  let idx = validator.validated.data.base.toUpperCase()

  if (idx in commonKeys) {
    idx = commonKeys[idx]
  }

  const params = {
    idx,
  }

  const reqConfig = {
    ...config.api,
    params,
    baseURL: 'https://indexes.nikkei.co.jp/en/nkave/',
    url,
  }
  const response = await Requester.request(reqConfig, customError)
  response.data.result = parseFloat(response.data.price.replace(',', ''))
  return response.data
}
