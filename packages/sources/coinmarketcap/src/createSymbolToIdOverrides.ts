import * as process from 'process'
import * as fs from 'fs'

import axios from 'axios'

type OverrideObj = {
  [adapterName: string]: {
    [symbol: string]: string
  }
}

type CoinData = {
  id: number
  name: string
  symbol: string
  slug: string
  rank: number
  [otherData: string]: unknown
}

export const getSymbolToIdOverrides = async (): Promise<OverrideObj> => {
  if (!process.env.API_KEY) throw Error('API_KEY environment variable not set.')
  const headers = { 'X-CMC_PRO_API_KEY': process.env.API_KEY }
  const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
    headers,
  })
  const coinsList = response.data.data
  const adapterSymToIdOverrides = {} as { [symbol: string]: string }

  coinsList.forEach((coinData: CoinData) => {
    adapterSymToIdOverrides[coinData.symbol] = coinData.id.toString()
  })

  return { coinmarketcap: adapterSymToIdOverrides }
}

const createSymbolToIdOverridesFile = async (): Promise<void> => {
  const symbolToIdOverrides = await getSymbolToIdOverrides()
  fs.writeFileSync('symbolToIdOverrides.json', JSON.stringify(symbolToIdOverrides), {
    encoding: 'utf-8',
  })
}

createSymbolToIdOverridesFile()
