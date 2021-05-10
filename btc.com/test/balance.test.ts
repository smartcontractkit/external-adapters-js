import { makeExecute } from '../src/adapter'
import { Requester } from '@chainlink/external-adapter'
import { DEFAULT_API_ENDPOINT } from '../src/config'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

const config = Requester.getDefaultConfig()
config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
config.apiSecret = process.env.API_SECRET || ''
config.apiKey = process.env.API_KEY || ''

shouldBehaveLikeBalanceAdapter(makeExecute(config), ['bitcoin_mainnet'])
