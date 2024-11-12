import { BigNumber, BigNumberish } from 'ethers'
import Decimal from 'decimal.js'
import axios from 'axios'
import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'

export type TokenAllocation = {
  symbol: string
  decimals: number
  balance: BigNumberish
}

export type TokenAllocationInput = {
  symbol: string
  decimals?: unknown
  balance?: unknown
}

export type ResponsePayload = {
  [symbol: string]: {
    quote: {
      [symbol: string]: {
        price?: number
        marketcap?: number
      }
    }
  }
}

export type TAResponse = {
  sources: never[]
  payload: ResponsePayload
  result: number
}

export const methodOptions = ['marketcap', 'price'] as const

export type TAMethod = (typeof methodOptions)[number]

type TokenAllocatorOptions = {
  token_decimals: number
  token_balance: number
  method: TAMethod
  quote: string
}

const defaultOptions: TokenAllocatorOptions = {
  token_decimals: 18, // Used when `decimals` is missing or invalid in the allocation object
  token_balance: 1, // Used when `balance` is missing or invalid in the allocation object
  method: 'price',
  quote: 'USD',
}

/**
 * Types of a parameter for `getTotalAllocations` function
 */
export type TotalAllocationParams = {
  allocations: TokenAllocationInput[]
  sourceUrl: string
  method?: TAMethod
  quote?: string
  additionalInput?: Record<string, unknown>
}

/**
 * Base token allocation config that consumer EAs can use
 */
export const tokenAllocationSourceDefinition = {
  COINGECKO_ADAPTER_URL: {
    description: 'The location of a CoinGecko external adapter',
    type: 'string',
  },
  COINMARKETCAP_ADAPTER_URL: {
    description: 'The location of a CoinMarketCap external adapter',
    type: 'string',
  },
  COINMETRICS_ADAPTER_URL: {
    description: 'The location of a CoinMetrics external adapter',
    type: 'string',
  },
  COINPAPRIKA_ADAPTER_URL: {
    description: 'The location of a CoinPaprika external adapter',
    type: 'string',
  },
  COINRANKING_ADAPTER_URL: {
    description: 'The location of a CoinRanking external adapter',
    type: 'string',
  },
  CRYPTOCOMPARE_ADAPTER_URL: {
    description: 'The location of a CryptoCompare external adapter',
    type: 'string',
  },
  KAIKO_ADAPTER_URL: {
    description: 'The location of a Kaiko external adapter',
    type: 'string',
  },
  TIINGO_ADAPTER_URL: {
    description: 'The location of a Tiingo external adapter',
    type: 'string',
  },
  AMBERDATA_ADAPTER_URL: {
    description: 'The location of a Amberdata external adapter',
    type: 'string',
  },
  COINAPI_ADAPTER_URL: {
    description: 'The location of a CoinApi external adapter',
    type: 'string',
  },
  NCFX_ADAPTER_URL: {
    description: 'The location of a NCFX external adapter',
    type: 'string',
  },
  CFBENCHMARKS_ADAPTER_URL: {
    description: 'The location of a CFBenchmarks external adapter',
    type: 'string',
  },
  FINAGE_ADAPTER_URL: {
    description: 'The location of a Finage external adapter',
    type: 'string',
  },
} as const satisfies SettingsDefinitionMap

export type TASourceEnvName = keyof typeof tokenAllocationSourceDefinition

/**
 * Legacy type config for v2 EAs. Based on TASourceEnvName type (EA-NAME_ADAPTER_URL) this produces new type like `ea-name?: string`
 */
export type TALegacyConfig = {
  [key in Lowercase<
    TASourceEnvName extends `${infer Prefix}_ADAPTER_URL` ? Prefix : never
  >]?: string
}

const validate = (allocations: TokenAllocationInput[], method: string) => {
  if (!methodOptions.includes(method?.toLowerCase() as TAMethod)) {
    throw new Error('Invalid method.')
  }

  const _toValidSymbol = (symbol: unknown) => {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Symbol not available for all tokens.')
    }
    return symbol.toUpperCase()
  }
  const _toValidDecimals = (decimals: unknown): number => {
    if (decimals === undefined) {
      return defaultOptions.token_decimals
    }
    return !isNaN(Number(decimals)) && Number(decimals) >= 0
      ? (decimals as number)
      : defaultOptions.token_decimals
  }
  const _toValidBalance = (balance: unknown, decimals: number): number | string => {
    if (!balance) {
      return defaultOptions.token_balance * 10 ** decimals
    }
    let BNbalance
    try {
      BNbalance = BigNumber.from(balance.toString())
    } catch (e: unknown) {
      const error = e as Error
      throw new Error(`Invalid balance: ${error.message}`)
    }
    if (BNbalance.isNegative()) {
      throw new Error(`Balance cannot be negative`)
    }
    return balance as number | string
  }
  return allocations.map((t) => {
    if (typeof t !== 'object') {
      throw new Error(`Invalid allocations`)
    }
    const aObj = t as TokenAllocation

    const decimals = _toValidDecimals(aObj.decimals)
    return {
      symbol: _toValidSymbol(aObj.symbol),
      decimals,
      balance: _toValidBalance(aObj.balance, decimals),
    }
  })
}

const makeRequest = async (
  sourceUrl: string,
  symbols: string[],
  quote: string,
  method: TAMethod,
  additionalInput: Record<string, unknown> = {},
): Promise<ResponsePayload> => {
  const results = await Promise.all(
    symbols.map(async (base) => {
      const data = {
        data: {
          ...additionalInput,
          base,
          quote,
          endpoint: method === 'price' ? 'crypto' : method,
        },
      }

      const requestConfig = {
        url: sourceUrl,
        method: 'POST',
        data,
      }
      const response = await axios<{ result: number }>(requestConfig)
      return response.data.result
    }),
  )
  const payloadEntries = symbols.map((symbol, i) => {
    const key = symbol
    const val = {
      quote: {
        [quote]: { [method]: results[i] },
      },
    }
    return [key, val]
  })

  return Object.fromEntries(payloadEntries)
}

const getTotalValue = (
  allocationData: TokenAllocation[],
  quote: string,
  payload: ResponsePayload,
  method: TAMethod,
): number => {
  return allocationData
    .reduce((acc, t) => {
      const val = payload[t.symbol].quote[quote][method]
      if (!val) {
        throw new Error(`No marketcap value found for ${t.symbol}/${quote}.`)
      }
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      return acc.add(coins.mul(val))
    }, new Decimal(0))
    .toNumber()
}

const computeTotal = async (
  sourceUrl: string,
  allocationData: TokenAllocation[],
  quote: string,
  method: TAMethod,
  additionalInput?: Record<string, unknown>,
) => {
  const symbols = allocationData.map((t) => t.symbol)
  const uniqueSymbols = [...new Set(symbols)]
  const payload = await makeRequest(sourceUrl, uniqueSymbols, quote, method, additionalInput)
  const result = getTotalValue(allocationData, quote, payload, method)
  return { result, payload }
}

export const getTotalAllocations = async (params: TotalAllocationParams): Promise<TAResponse> => {
  Decimal.set({ precision: 100 })
  const {
    allocations,
    sourceUrl,
    method = defaultOptions.method,
    quote = defaultOptions.quote,
    additionalInput,
  } = params

  const allocationData: TokenAllocation[] = validate(allocations, method)
  const { result, payload } = await computeTotal(
    sourceUrl,
    allocationData,
    quote,
    method,
    additionalInput,
  )
  return { sources: [], payload, result }
}
