import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'dash_mainnet',
  'doge_mainnet',
  'litecoin_mainnet',
  'bitcoin_cash_mainnet',
])
