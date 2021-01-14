import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint || 'price'
  const url = `https://min-api.cryptocompare.com/data/${endpoint}`
  const fsym = validator.validated.data.base.toUpperCase()
  const tsyms = validator.validated.data.quote.toUpperCase()

  const params = {
    fsym,
    tsyms,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  if (process.env.API_KEY) {
    reqConfig.headers = {
      authorization: `Apikey ${util.getRandomRequiredEnv('API_KEY')}`,
    }
  }

  const response = await Requester.request(reqConfig, customError)
  return Requester.validateResultNumber(response.data, [tsyms])
}
