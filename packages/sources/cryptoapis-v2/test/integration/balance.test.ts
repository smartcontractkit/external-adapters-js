import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'bitcoin_testnet',
  'ethereum_mainnet',
  'ethereum_testnet',
  'bitcoin_cash_mainnet',
  'bitcoin_cash_testnet',
  'ethereum_classic_mainnet',
  'ethereum_classic_testnet',
  'litecoin_mainnet',
  'litecoin_testnet',
  'doge_mainnet',
  'doge_testnet',
  'dash_mainnet',
  'dash_testnet',
])
