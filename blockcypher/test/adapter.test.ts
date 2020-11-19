import { execute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(execute, ['bitcoinmainnet'])
