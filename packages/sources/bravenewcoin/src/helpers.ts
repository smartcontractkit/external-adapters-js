import { Requester } from '@chainlink/ea-bootstrap'

export const host = 'bravenewcoin.p.rapidapi.com'
export const apiHeaders = {
  'x-rapidapi-host': host,
  'x-rapidapi-key': process.env.API_KEY || 'test-api-key',
}

export interface Change {
  change24h: number
  change30d: number
  change7d: number
}

export interface MarketCap {
  content: {
    assetId: string
    freeFloatSupply: number
    id: string
    marketCap: number
    marketCapPercentChange: Change
    marketCapRank: number
    price: number
    pricePercentChange: Change
    timestamp: string
    totalMarketCap: number
    totalMarketCapPercentChange: Change
    totalSupply: number
    volume: number
    volumePercentChange: Change
    volumeRank: number
  }[]
}

export interface Asset {
  content: {
    id: string
    name: string
    status: string
    symbol: string
    type: string
    url: string
  }[]
}

export interface AuthResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export const authenticate = async (): Promise<string> => {
  const response = await Requester.request<AuthResponse>({
    method: 'POST',
    url: `https://${host}/oauth/token`,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...apiHeaders,
    },
    data: {
      audience: 'https://api.bravenewcoin.com',
      client_id: process.env.CLIENT_ID,
      grant_type: 'client_credentials',
    },
  })
  return response.data.access_token
}

export const getAssetId = async (symbol: string): Promise<string> => {
  const response = await Requester.request<Asset>({
    url: `https://${host}/asset`,
    headers: {
      'content-type': 'application/octet-stream',
      ...apiHeaders,
    },
    params: {
      status: 'ACTIVE',
      symbol,
    },
  })
  return response.data.content[0].id
}

export const convert = async (
  token: string,
  baseAssetId: string,
  quoteAssetId: string,
): Promise<{ status: number; data: { result: number }; result: number }> => {
  const url = `https://${host}/market-cap`
  const path = ['content', 0, 'price']
  const base = await Requester.request<MarketCap>({
    url,
    headers: {
      ...apiHeaders,
      authorization: `Bearer ${token}`,
    },
    params: {
      assetId: baseAssetId,
    },
  })
  const basePrice = Requester.validateResultNumber(base.data, path)
  if (quoteAssetId.toUpperCase() === 'USD') {
    const result = basePrice
    return {
      status: 200,
      data: { result },
      result,
    }
  }
  const quote = await Requester.request<MarketCap>({
    url,
    headers: {
      ...apiHeaders,
      authorization: `Bearer ${token}`,
    },
    params: {
      assetId: quoteAssetId,
    },
  })
  const quotePrice = Requester.validateResultNumber(quote.data, path)
  const result = basePrice / quotePrice
  return {
    status: 200,
    data: { result },
    result,
  }
}
