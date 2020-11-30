import { expose, util } from '@chainlink/ea-bootstrap'
import execute from './adapter'

export = { execute, ...expose(util.wrapExecute(execute)) }
