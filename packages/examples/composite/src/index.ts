import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'EXAMPLE_COMPOSITE'

const { server } = expose(NAME, makeExecute())
export { NAME, makeExecute, makeConfig, server }
