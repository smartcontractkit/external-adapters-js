import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

shouldBehaveLikeBalanceAdapter(makeExecute(), ['bitcoin_mainnet', 'bitcoin_testnet'])
