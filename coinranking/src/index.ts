import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'Coinranking'

export = { NAME, execute, ...expose(execute) }
