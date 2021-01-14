import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

const DEMO_ENDPOINT = 'https://tools.dxfeed.com/webservice/rest'
const DEFAULT_DATA_ENDPOINT = 'events.json'

export const Name = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
}

const commonSymbols: { [key: string]: string } = {
  N225: 'NKY.IND:TEI',
  FTSE: 'UKX.IND:TEI',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const username = process.env.API_USERNAME
  const password = process.env.API_PASSWORD

  const apiEndpoint = process.env.API_ENDPOINT || DEMO_ENDPOINT
  if (apiEndpoint === DEMO_ENDPOINT)
    console.warn(`Using demo endpoint: ${DEMO_ENDPOINT} (Please do not use in production!)`)

  const endpoint = validator.validated.data.endpoint || DEFAULT_DATA_ENDPOINT
  const url = `${apiEndpoint}/${endpoint}`
  let symbols = validator.validated.data.base.toUpperCase()
  if (symbols in commonSymbols) {
    symbols = commonSymbols[symbols]
  }

  const params = {
    events: 'Trade',
    symbols,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
    auth: { username, password },
  }
  const response = await Requester.request(reqConfig, customError)
  console.log(reqConfig)
  console.log(response.data)
  return Requester.validateResultNumber(response.data, [
    'Trade',
    symbols,
    'price',
  ])
}
