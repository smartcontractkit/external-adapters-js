import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'XBTO'

const { server } = expose(NAME, makeExecute())
export { NAME, makeExecute, makeConfig, server }
