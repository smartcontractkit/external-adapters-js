import crypto from 'crypto'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'
import { SigningAlgorithm } from '../transport/utils'

const logger = makeLogger('BankFrickConfig')

// Used for enum options and validation
export const signingAlgorithms: SigningAlgorithm[] = ['rsa-sha256', 'rsa-sha384', 'rsa-sha512']
const MAX_PAGE_SIZE = 500

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The endpoint to use for making requests to the Bank Frick API',
    type: 'string',
    required: false,
    default: 'https://olbsandbox.bankfrick.li/webapi/v2',
  },
  API_KEY: {
    description: 'The API key to use for making requests to the Bank Frick API',
    type: 'string',
    required: true,
  },
  PAGE_SIZE: {
    description: 'The number of accounts to fetch per call to /accounts. Must be >= 1 and <= 500.',
    type: 'number',
    required: false,
    default: MAX_PAGE_SIZE,
    validate: validator.integer({ min: 1, max: 500 }),
  },
  PRIVATE_KEY: {
    description: '',
    type: 'string',
    required: true,
    validate: {
      meta: {
        details: 'Invalid private key',
      },
      fn: (value?: string) => {
        if (value) {
          // Some internal creds have 'BEGIN PRIVATE KEY', but all production creds use 'BEGIN RSA PRIVATE KEY'. This captures both.
          if (!value.match(/-----?BEGIN ([A-Z ])*PRIVATE KEY-----?/)) {
            logger.info(
              "Could not find 'BEGIN PRIVATE KEY' in PRIVATE_KEY envvar. Assuming it's a base64 encoded string",
            )
            value = Buffer.from(value, 'base64').toString('utf8')
          }

          logger.debug(
            'Attempting to sign a test message with any of the following SigningAlgorithms: ',
            signingAlgorithms,
          )
          const failedAlgos: SigningAlgorithm[] = []
          for (const algorithm of signingAlgorithms) {
            const body = { example: 123 }
            try {
              crypto.sign(algorithm, Buffer.from(JSON.stringify(body)), value)
              logger.trace(
                "Successfully tested PRIVATE_KEY by signing with algorithm '%s'",
                algorithm,
              )
            } catch {
              logger.trace("PRIVATE_KEY failed to sign message with algorithm '%s'", algorithm)
              failedAlgos.push(algorithm)
            }
          }

          if (failedAlgos.length > 0) {
            return `Failed to sign a dummy body using $PRIVATE_KEY with the following algorithms ${failedAlgos.join(
              ',',
            )}. The PRIVATE_KEY config item must be either a string containing the full private key (including newlines
      and the BEGIN/END PRIVATE KEY lines), or a base64 encoded string that can be decoded into the full private key`
          } else {
            logger.debug(
              '$PRIVATE_KEY successfully signed a dummy body with all supported algorithms',
            )
            return ''
          }
        } else {
          return 'PRIVATE_KEY is required.'
        }
      },
    },
  },
})
