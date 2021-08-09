import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'CRYPTO_VOLATILITY_INDEX'
const { server } = expose(NAME, execute)
export { NAME, execute, server }
