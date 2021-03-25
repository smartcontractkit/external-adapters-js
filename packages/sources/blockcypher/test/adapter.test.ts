import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), ['bitcoin_mainnet'])
