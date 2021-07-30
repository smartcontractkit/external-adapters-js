import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'ethereum_mainnet',
  'bitcoin_cash_mainnet',
  'bitcoin_sv_mainnet',
  'litecoin_mainnet',
  'zcash_mainnet',
])
