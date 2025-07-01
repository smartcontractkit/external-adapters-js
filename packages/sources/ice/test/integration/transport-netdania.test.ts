import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { clientTests, loggerFactory } from './client-common.cases'
import * as process from 'node:process'

LoggerFactoryProvider.set(loggerFactory)

/** These tests depend on a live NetDania connection, they should not be run in CI
 *  However, they should be run locally to ensure the API client is working correctly with respect to
 *  the actual API.
 *
 *  I.e. by running the same tests both against the real API and the mocked one, we ensure the mocked
 *  API behaves like the real one, to the extent the client verifies it. If we don't, our double is
 *  nothing but a bunch of suppositions.
 *
 *  Set the password in order to run them.
 */
const locally = process.env.CI || !process.env.NETDANIA_PASSWORD ? describe.skip : describe

locally('API client tests (against the real API)', () => {
  describe('.', clientTests) // double describe() required for IDEs to recognize the tests :shrug:
})
