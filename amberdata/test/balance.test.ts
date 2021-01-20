import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'ethereum_mainnet',
  'bitcoin_cash_mainnet',
  'bitcoin_sv_mainnet',
  'litecoin_mainnet',
  'zcash_mainnet',
])
