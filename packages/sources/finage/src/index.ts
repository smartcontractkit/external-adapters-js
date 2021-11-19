import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose(NAME, makeExecute(), makeWSHandler())
export { NAME, makeExecute, makeConfig, server }
