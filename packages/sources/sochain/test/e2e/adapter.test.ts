import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'bitcoin_testnet',
  'dash_mainnet',
  'dash_testnet',
  'doge_mainnet',
  'doge_testnet',
  'litecoin_mainnet',
  'litecoin_testnet',
  'zcash_mainnet',
  'zcash_testnet',
])
