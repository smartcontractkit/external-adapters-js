import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose(NAME, makeExecute(), undefined)

export { NAME, makeExecute, makeConfig, server }
