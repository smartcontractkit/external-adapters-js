import { buildQuoteEndpoint } from '@chainlink/finnhub-adapter'
import overrides from '../config/overrides.json'

export const endpoint = buildQuoteEndpoint('OANDA', overrides.finnhub)
