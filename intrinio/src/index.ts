import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, startService } from './adapter'
import { makeConfig, NAME } from './config'

const makeExecuteWS = () => {
  startService(makeConfig())
  return makeExecute()
}

export = { NAME, makeExecute, makeConfig, ...expose(makeExecuteWS()) }
