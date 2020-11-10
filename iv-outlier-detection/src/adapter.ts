import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { fetchGenesisVolatility } from './genesisVolatility'
import { fetchDerbit } from './derbit'

export type ExternalFetch = (symbol: string, days: number) => Promise<number>

const difference = (a: number, b: number): number => {
  return (Math.abs(a - b) / ((a + b) / 2)) * 100
}

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  days: ['days', 'period'],
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  if (!input.meta || !input.meta.latestAnswer) throw new Error('missing meta data')

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol.toUpperCase()
  const days = validator.validated.data.days

  const result = await fetchGenesisVolatility(symbol, days)
  const derbit = await fetchDerbit(symbol, days)

  if (difference(result, derbit) > 30) {
    throw new Error('value difference between Genesis Volatility and Derbit is more than 30%')
  }

  const onChainValue = input.meta.latestAnswer as number
  if (onChainValue !== 0 && difference(result, onChainValue) > 50) {
    throw new Error('value difference between Genesis Volatility and on-chain is more than 30%')
  }

  const response = { data: { result }, result, status: 200 }
  return Requester.success(jobRunID, response)
}
