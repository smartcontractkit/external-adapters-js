import { types } from '@chainlink/token-allocation-adapter'
import { Requester } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'
import { Config } from '@chainlink/types'
import moment from 'moment-timezone'

interface Portfolio {
  name: string
  project_id: string
  symbol: string
  weight: number
  unit: number
  credibility_rating: string
}

interface ResponseSchema {
  data: {
    index_value: {
      value: number
      reference_timestamp_utc: string
    }
    portfolio_reference_utc: string
    portfolio: Portfolio[]
  }
}

export const deriveAllocations = async (
  config: Config,
  path: string,
): Promise<types.TokenAllocations> => {
  const now = moment().tz('GMT').format('YYYY-MM-DD[T]hh:mm:ss')
  const options = {
    ...config.api,
    url: path,
    params: {
      reference_timestamp: now,
    },
  }
  const resp = await Requester.request<ResponseSchema>(options)
  const indices = resp.data.data.portfolio
  return indices.map((index) => ({
    symbol: index.symbol.toUpperCase(),
    balance: new Decimal(index.unit).mul(1e18).toFixed(0),
    decimals: 18,
  }))
}
