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
  const result = parseFloat(response.data.price.replace(',', ''))
  return Requester.success(jobRunID, {
    data: {
      ...response.data,
      result,
    },
    result,
    status: 200,
  })
}
