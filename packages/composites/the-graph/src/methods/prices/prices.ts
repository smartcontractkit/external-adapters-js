import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { Config } from '../../config'
import { ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'price'

const customParams = {
  baseCoinTicker: ['baseCoinTicker', 'base', 'from', 'coin'],
  quoteCoinTicker: ['quoteCoinTicker', 'quote', 'to', 'market'],
  dex: true,
  intermediaryToken: false,
  referenceContract: false,
  referenceContractDivisor: false,
  theGraphQuote: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const inputParams = validator.validated.data
  if (!inputParams.theGraphQuote && !inputParams.quoteCoinTicker) {
      throw new Error("quoteCoinTicker cannot be empty if theGraphQuote not supplied")
  }
  const dexToUpperCase = inputParams.dex.toUpperCase()
  const dexSubgraph = config.dexSubgraphs[dexToUpperCase]
  if (!dexSubgraph) {
    throw new Error(`${inputParams.dex} is currently not supported`)
  }
  const price = await dexSubgraph.execute(jobRunID, inputParams)
  return Requester.success(jobRunID, {
      status: 200,
      data: {
          result: price
      }
  }, true)
}