import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'APY-Finance'
const { server } = expose(makeExecute())
export { NAME, makeConfig, makeExecute, server }
