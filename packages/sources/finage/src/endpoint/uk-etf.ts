import { makeEtfExecute } from './etf'
import { inputParameters as etfInputParameters } from './etf'

export const supportedEndpoints = ['uk_etf']
export const batchablePropertyPath = [{ name: 'base' }]

export const inputParameters = etfInputParameters

export const description = `https://finage.co.uk/docs/api/etf-last-price
The result will be the price field in response.`

export const execute = makeEtfExecute()
