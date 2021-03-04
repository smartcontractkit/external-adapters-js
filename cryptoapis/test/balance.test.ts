import adapter from '../src/index'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(adapter.makeExecute(), [
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
  'bitcoin_sv_mainnet',
  'bitcoin_sv_testnet',
  'zilliqa_mainnet',
])
