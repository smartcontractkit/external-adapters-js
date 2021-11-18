import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'DEFI_DOZEN'
const { server } = expose(NAME, makeExecute())
export { NAME, makeConfig, makeExecute, server }
