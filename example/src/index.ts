import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'EXAMPLE' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
