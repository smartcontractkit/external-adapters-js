import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'dash_mainnet',
  'doge_mainnet',
  'litecoin_mainnet',
  'bitcoin_cash_mainnet',
])
