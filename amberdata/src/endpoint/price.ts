import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const Name = 'price'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const addressMapping: { [symbol: string]: string } = {
  DIGG: '0x798d1be841a82a273720ce31c822c61a67a601c3',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  includes: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const includes = validator.validated.data.includes || []

  let url = `/api/v2/market/spot/prices/pairs/${coin.toLowerCase()}_${market.toLowerCase()}/latest`
  let params: { [key: string]: any } = {
    includeCrossRates: true,
  }

  if (
    includes.length > 0 &&
    includes[0].toLowerCase() === 'wbtc' &&
    coin.toLowerCase() === 'digg'
  ) {
    const fromAddress = addressMapping[coin.toUpperCase()]
    const toAddress = addressMapping[includes[0].toUpperCase()]
    url = `/api/v2/market/defi/prices/pairs/bases/${fromAddress}/quotes/${toAddress}/latest`
    params = {}
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', 'price'])
  return Requester.success(jobRunID, response)
}
