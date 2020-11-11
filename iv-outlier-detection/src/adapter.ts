import { AdapterResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { fetchGenesisVolatility } from './genesisVolatility'
import { fetchDerbit } from './derbit'
import { getLatestAnswer } from '@chainlink/reference-data-reader'

const onchainThreshold = process.env.DIFF_ON_CHAIN_THRESHOLD || 50
const derbitThreshold = process.env.DIFF_DERBIT_THRESHOLD || 30

export type ExternalFetch = (symbol: string, days: number) => Promise<number>

const difference = (a: number, b: number): number => {
  return (Math.abs(a - b) / ((a + b) / 2)) * 100
}

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  days: ['days', 'period'],
  contract: ['referenceContract', 'contract'],
  multiply: true,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol.toUpperCase()
  const days = validator.validated.data.days
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply

  const onChainValue = await getLatestAnswer(contract, multiply, input.meta)

  const result = await fetchGenesisVolatility(symbol, days)
  if (onChainValue !== 0 && difference(result, onChainValue) > onchainThreshold) {
    return returnValue(jobRunID, onChainValue)
  }

  const derbit = await fetchDerbit(symbol, days)
  if (difference(result, derbit) > derbitThreshold) {
    return returnValue(jobRunID, onChainValue)
  }

  return returnValue(jobRunID, result)
}

const returnValue = (jobRunID: string, result: number): AdapterResponse => {
  const response = { data: { result }, result, status: 200 }
  return Requester.success(jobRunID, response)
}
