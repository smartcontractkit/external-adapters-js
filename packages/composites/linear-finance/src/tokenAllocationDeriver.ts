import { types } from '@chainlink/token-allocation-adapter'
import { Requester } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'
import { Config } from '@chainlink/types'

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
  const options = {
    ...config.api,
    url: path,
    params: {
      reference_timestamp: '2021-01-02T00:00:00',
    }, // TODO:  Don't hardcode when done testing
  }
  const resp = await Requester.request<ResponseSchema>(options)
  const indices = resp.data.data.portfolio
  return indices.map((index) => ({
    symbol: index.symbol.toUpperCase(),
    balance: new Decimal(index.unit).mul(1e18).toFixed(0),
    decimals: 18,
  }))
}
