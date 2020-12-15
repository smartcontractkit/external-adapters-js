import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

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
