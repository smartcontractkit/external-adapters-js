import axios from 'axios'
import crypto from 'crypto'
import { Decimal } from 'decimal.js'
import { ethers } from 'ethers'
import { config } from '../config'

const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const SUPPORTED_ASSETS = [
  'BTC',
  'ETH',
  'SOL',
  'USDC',
  'USDT',
  'USTB',
  'USYC',
  'OUSG',
  'JTRSY',
] as const
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number]

export const isSupportedAsset = (currency: string): currency is SupportedAsset => {
  return SUPPORTED_ASSETS.includes(currency.toUpperCase() as SupportedAsset)
}

export interface PriceData {
  price: Decimal
  decimals: number
}

export interface Wallet {
  walletId: string
  portfolioId: string
  portfolioType: string
  currency: string
  mainCurrency: string
  balance: string
  stakeBalance: string
  totalBalance: string
  available: string
  locked: string
  reserve: string
  updatedAt: string
  createdAt: string
}

interface WalletsResponseSchema {
  wallets: Wallet[]
}

export const getChainlinkPrice = async (
  feedAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<PriceData> => {
  const contract = new ethers.Contract(feedAddress, AGGREGATOR_ABI, provider)
  const [decimals, latestAnswer]: [bigint, bigint] = await Promise.all([
    contract.decimals(),
    contract.latestAnswer(),
  ])

  return {
    price: new Decimal(latestAnswer.toString()),
    decimals: Number(decimals),
  }
}

interface NavDataEntry {
  net_asset_value: string
  date: string
}

export const getSuperstateNav = async (apiEndpoint: string, fundId: number): Promise<Decimal> => {
  const response = await axios.get<NavDataEntry[]>(`${apiEndpoint}/funds/${fundId}/nav-daily`, {
    params: {
      start_date: getDateString(-7),
      end_date: getDateString(0),
    },
  })

  if (!response.data?.length) {
    throw new Error(`No NAV data received from Superstate for fund ${fundId}`)
  }

  const sortedData = [...response.data].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return new Decimal(sortedData[0].net_asset_value)
}

const getDateString = (daysOffset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0]
}

export const getFeedAddress = (
  currency: string,
  settings: typeof config.settings,
): string | null => {
  const upperCurrency = currency.toUpperCase()
  switch (upperCurrency) {
    case 'BTC':
      return settings.BTC_USD_FEED_ADDRESS
    case 'ETH':
      return settings.ETH_USD_FEED_ADDRESS
    case 'SOL':
      return settings.SOL_USD_FEED_ADDRESS
    case 'USDC':
      return settings.USDC_USD_FEED_ADDRESS
    case 'USDT':
      return settings.USDT_USD_FEED_ADDRESS
    case 'USYC':
      return settings.USYC_USD_FEED_ADDRESS
    case 'OUSG':
      return settings.OUSG_USD_FEED_ADDRESS
    case 'JTRSY':
      return settings.JTRSY_USD_FEED_ADDRESS
    default:
      return null
  }
}

export const convertToUsd = (balance: Decimal, priceData: PriceData): Decimal => {
  const divisor = new Decimal(10).pow(priceData.decimals)
  return balance.mul(priceData.price).div(divisor)
}

const generateHmacSignature = (
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string,
): string => {
  const payload = `${timestamp}${method}${path}${body}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export const fetchWalletsFromCopper = async (
  apiEndpoint: string,
  apiKey: string,
  apiSecret: string,
): Promise<Wallet[]> => {
  const timestamp = Date.now().toString()
  const method = 'GET'
  const path = '/wallets'
  const body = ''

  const signature = generateHmacSignature(apiSecret, timestamp, method, path, body)

  let response
  try {
    response = await axios.get<WalletsResponseSchema>(`${apiEndpoint}${path}`, {
      headers: {
        accept: 'application/json',
        'X-COPPER-API-KEY': apiKey,
        'X-COPPER-SIGNATURE': signature,
        'X-COPPER-TIMESTAMP': timestamp,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Copper API request failed: ${message}`)
  }

  if (!response.data || !response.data.wallets) {
    throw new Error('Copper API returned invalid response: missing wallets data')
  }

  return response.data.wallets
}
