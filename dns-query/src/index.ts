import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'
export * from './types'

const NAME = 'DNS-Query'

export {
  NAME,
  makeConfig,
  makeExecute,
  // TODO:: export the following as well
  //   ...expose(util.wrapExecute(makeExecute())),
}
