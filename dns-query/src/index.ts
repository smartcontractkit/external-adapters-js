import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'DNS-Query'

const execute = makeExecute()

export = {
  NAME,
  makeConfig,
  makeExecute,
  ...expose(execute),
}
