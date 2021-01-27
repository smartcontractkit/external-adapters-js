import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'convert'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const url = `convert`

  const params = {
    access_key: util.getRandomRequiredEnv('API_KEY'),
    from,
    to,
    amount: 1,
  }

  const reqConfig = { ...config.api, params, baseURL: 'https://metals-api.com/api/', url }

  const response = await Requester.request(reqConfig, customError)
  return response.data
}
