import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'dash_mainnet',
  'doge_mainnet',
  'litecoin_mainnet',
  'zcash_mainnet',
  'bitcoin_cash_mainnet',
  'bitcoin_sv_mainnet',
  'groestlcoin_mainnet',
])
