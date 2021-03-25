import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const Name = 'price'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const addressMapping: { [symbol: string]: string } = {
  DIGG: '0x798d1be841a82a273720ce31c822c61a67a601c3',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  RAI: '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  RGT: '0xD291E7a03283640FDc51b121aC401383A46cC623',
  RARI: '0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF',
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

  const coin = validator.overrideSymbol(AdapterName)
  const market = validator.validated.data.quote
  const includes = validator.validated.data.includes || []

  let url = `/api/v2/market/spot/prices/pairs/${coin.toLowerCase()}_${market.toLowerCase()}/latest`
  let params: { [key: string]: any } = {
    includeCrossRates: true,
  }

  if (
    includes.length > 0 &&
    ((includes[0].toLowerCase() === 'wbtc' && coin.toLowerCase() === 'digg') ||
      (includes[0].toLowerCase() === 'weth' && coin.toLowerCase() === 'rai') ||
      (includes[0].toLowerCase() === 'weth' && coin.toLowerCase() === 'rgt') ||
      (includes[0].toLowerCase() === 'weth' && coin.toLowerCase() === 'rari'))
  ) {
    const fromAddress = addressMapping[coin.toUpperCase()]
    const toAddress = addressMapping[includes[0].toUpperCase()]
    url = `/api/v2/market/defi/prices/pairs/bases/${fromAddress}/quotes/${toAddress}/latest`
    params = {}
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', 'price'])
  return Requester.success(jobRunID, response, config.verbose)
}
