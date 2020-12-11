import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), [
  'bitcoin_mainnet',
  'ethereum_mainnet',
  'ethereum_rinkeby',
])
