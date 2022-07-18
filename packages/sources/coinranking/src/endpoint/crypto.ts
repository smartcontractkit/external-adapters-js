import { ExecuteWithConfig, Config, InputParameters, AdapterError } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'marketCap',
}

export interface ResponseSchema {
  data: {
    coins: {
      '24hVolume': string
      btcPrice: string
      change: string
      coinrankingUrl: string
      color: string
      iconUrl: string
      listedAt: number
      lowVolume: boolean
      marketCap: string
      name: string
      price: string
      rank: number
      sparkline: string[]
      symbol: string
      tier: number
      uuid: string
    }[]
    stats: {
      total: number
      total24hVolume: string
      totalExchanges: number
      totalMarketCap: string
      totalMarkets: number
    }
  }
  status: string
}

interface ReferenceCurrenciesResponseSchema {
  data: {
    currencies: {
      iconUrl: string
      name: string
      sign: string
      symbol: string
      type: string
      uuid: string
    }[]
    stats: { total: number }
  }
  status: string
}

export const description = 'https://api.coinranking.com/v2/coins'

export type TInputParameters = {
  base: string
  quote: string
  coinid: string
  referenceCurrencyUuid: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  coinid: {
    description: 'The coin ID to select the specific coin (in case of duplicate `from` symbols)',
    required: false,
  },
  referenceCurrencyUuid: {
    description: 'Optional UUID of the `to` currency',
    required: false,
    type: 'string',
  },
}

const referenceSymbolToUuid = async (symbol: string, config: Config): Promise<string> => {
  const url = 'reference-currencies'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request<ReferenceCurrenciesResponseSchema>(options)
  const currency = response.data.data.currencies.find(
    (x) => x.symbol.toLowerCase() === symbol.toLowerCase(),
  )
  if (!currency) throw Error(`Currency not found for symbol: ${symbol}`)
  return currency.uuid
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid
  const overridenCoinid = validator.validated.data.coinid
    ? validator.overrideSymbol(AdapterName, validator.validated.data.coinid)
    : undefined
  let referenceCurrencyUuid = validator.validated.data.referenceCurrencyUuid as string | undefined
  const resultPath = validator.validated.data.resultPath

  let cost = 1
  if (!referenceCurrencyUuid && quote.toUpperCase() !== 'USD') {
    referenceCurrencyUuid = await referenceSymbolToUuid(quote, config)
    cost = 2
  }

  const params = { symbols: [symbol], referenceCurrencyUuid }

  const url = 'coins'
  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema & { cost?: number }>(options)

  // If coinid was provided or base was overridden, that UUID will be fetched
  const coinUuid = coinid || (overridenCoinid !== symbol && overridenCoinid)
  const coindata = response.data.data.coins.find((coin) => {
    if (coinUuid && coin.uuid === coinUuid) return true
    else if (!coinUuid && coin.symbol.toUpperCase() === symbol.toUpperCase()) return true
    return false
  })
  if (!coindata) {
    throw new AdapterError({
      message: `Unable to find coin: ${
        coinUuid || symbol
      } in DP response. This could be an issue with overrides, input params or the DP`,
    })
  }

  const result = Requester.validateResultNumber(coindata, resultPath)
  response.data.cost = cost
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
