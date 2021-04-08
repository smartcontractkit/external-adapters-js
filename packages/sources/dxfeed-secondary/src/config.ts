import * as dxfeed from '@chainlink/dxfeed-adapter'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_USERNAME:
 *      required: true
 *    API_PASSWORD:
 *      required: true
 *    API_ENDPOINT:
 *      required: false
 *      default: https://tools.dxfeed.com/webservice/rest
 */

export const NAME = 'DXFEED_SECONDARY'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => dxfeed.makeConfig(prefix)
