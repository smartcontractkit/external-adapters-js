import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME } from './config'

const { server } = expose(NAME, makeExecute())
export { makeExecute, server }
