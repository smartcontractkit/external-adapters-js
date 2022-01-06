import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'REDUCE'

const { server } = expose(NAME, execute)
export { NAME, execute, server }
