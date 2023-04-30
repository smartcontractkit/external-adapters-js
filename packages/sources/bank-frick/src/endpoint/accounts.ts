import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  SingleNumberResultResponse,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config'
import {
  Account,
  AdapterInputParameters,
  BankFrickAccountsRequestSchema,
  BankFrickAccountsResponseSchema,
  SigningAlgorithm,
} from '../types'
import { generateJWT } from '../util'

const logger = makeLogger('BankFrickTransport')

// Note: this is a shallow pattern that only checks for a country code since IBANs in the sandbox are invalid
const ibanPattern = /^[A-Z]{2}[A-Z\d]{14,30}$/
const inputParameters = new InputParameters({
  ibanIDs: {
    description: 'The list of account ids included in the sum of balances',
    required: true,
    type: 'string',
    array: true,
  },
  signingAlgorithm: {
    description:
      'What signing algorithm is used to sign and verify authorization data, one of rsa-sha256, rsa-sha384, or rsa-sha512',
    required: false,
    type: 'string',
    default: 'rsa-sha512',
    options: ['rsa-sha256', 'rsa-sha384', 'rsa-sha512'],
  },
})

// See here for all expected error returned by the API: https://developers.bankfrick.li/docs#errors
const AuthErrors: { [key: number]: string } = {
  401: 'No JWT token provided or token is invalid',
  403: 'API key is invalid or any other condition is hindering the login', // Unclear if this is fatal or not
}
const FatalErrors: { [key: number]: string } = {
  400: "Invalid parameters passed to Bank Frick's API",
  423: "Authorization is valid, but the user's account is locked",
}

export type AccountsEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

/**
 * RestTransport implementation for Bank Frick, which has unusually complex requirements for an EA
 * The RestTransport is generally built to make a single request and return a single response.
 * This transport instead is used to fetch and process pages of data, and also requires a JWT to run
 *
 * This transport does all the heavy lifting in setup(), which is where the paging happens, and it
 * also has complex retry logic that will attempt to refresh the JWT when certain HTTP errors occur
 */
export class BankFrickAccountsTransport implements Transport<AccountsEndpointTypes> {
  name!: string
  // Global variable to keep the token. Token is provisioned when the accounts endpoint is hit.
  // Each instance of the EA will have their own token by design
  token!: string

  cache!: Cache<AdapterResponse<AccountsEndpointTypes['Response']>>
  responseCache!: ResponseCache<AccountsEndpointTypes>

  async initialize(
    dependencies: TransportDependencies<AccountsEndpointTypes>,
    _: typeof config.settings,
    __: string,
    name: string,
  ): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<AccountsEndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
    this.name = name
  }

  /**
   * Creates an AxiosRequestConfig object for fetching a page of accounts from the Bank Frick API
   */
  prepareRequest(
    firstPosition: number,
    _: AdapterInputParameters,
    settings: typeof config.settings,
  ): AxiosRequestConfig<BankFrickAccountsRequestSchema> {
    const { API_ENDPOINT, PAGE_SIZE } = settings

    return {
      baseURL: API_ENDPOINT,
      url: 'accounts',
      method: 'GET',
      params: {
        firstPosition,
        maxResults: PAGE_SIZE,
      },
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    }
  }

  /**
   * Request with retry logic for Bank Frick's API. In addition to standard retry logic, this function
   * compares errors against expected errors from the Bank Frick API, and will throw without retries
   * on a known fatal error, or try to refresh the JWT on a known auth error
   **/
  async makeRequest(
    axiosRequest: AxiosRequestConfig<BankFrickAccountsRequestSchema>,
    settings: typeof config.settings,
    signingAlgorithm?: SigningAlgorithm,
  ): Promise<AxiosResponse<BankFrickAccountsResponseSchema>> {
    let retryNumber = 0
    let response = await axios.request(axiosRequest)
    while (response.status !== 200) {
      retryNumber++
      logger.warn(
        'Encountered error when fetching accounts from Bank Frick:',
        response.status,
        response.statusText,
      )

      // Evaluate whether the error was fatal, auth, or transient and whether we've exceeded the max number of retries.
      // Throw on fatal, refresh token on auth error, pass on transient until we've exhausted our retries
      if (FatalErrors[response.status]) {
        throw new AdapterError({
          statusCode: response.status,
          message: response.statusText,
        })
      } else if (AuthErrors[response.status]) {
        // We've encountered a known auth error, so try to refresh the token before making another request
        logger.info('Auth error received from the Bank Frick API, attempting to refresh the token')
        this.token = await generateJWT(settings, signingAlgorithm)
      } else if (retryNumber === settings.RETRY) {
        throw new AdapterError({
          statusCode: 504,
          message: `Bank Frick transport hit the max number of retries (${settings.RETRY} retries) and aborted`,
        })
      }
      const timeToSleep = (2 ** retryNumber + Math.random()) * 1000
      logger.debug(`Sleeping for ${timeToSleep}ms before retrying`)
      await sleep(timeToSleep)
      response = await axios.request(axiosRequest)
    }
    return response
  }

  validateInputParams(params: AdapterInputParameters): string[] {
    const encounteredIds: { [key: string]: number } = {}
    const errors: string[] = []
    const { ibanIDs } = params

    ibanIDs.forEach((v) => {
      if (!v.match(ibanPattern)) {
        errors.push(`Invalid IBAN: ${v}`)
      }
      encounteredIds[v] += 1
      if (encounteredIds[v] > 1) {
        errors.push(`The following IBAN appears more than once in the input parameters: ${v}`)
      }
    })
    return errors
  }

  /**
   * Fetches pages of data from the Bank Frick API, scans for accounts by IBAN, and returns the balance
   * of all found accounts. Returns a 404 if any IBAN isn't found.
   */
  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<AccountsEndpointTypes['Response']>> {
    const { ibanIDs, signingAlgorithm } = req.requestContext.data
    const { PAGE_SIZE = 500 } = settings

    logger.debug(`Validating input: ${JSON.stringify(req.requestContext.data)}`)

    // Scan ibanIDs for duplicates and invalid IBANs
    const validationErrors = this.validateInputParams(req.requestContext.data)
    if (validationErrors.length > 0) {
      throw new AdapterError({
        statusCode: 420,
        message: `Received the following errors when validating inputParameters:\n ${validationErrors.join(
          '\n',
        )}`,
      })
    }

    // Refresh the token if it isn't set
    if (!this.token) {
      this.token = await generateJWT(settings, signingAlgorithm)
    }

    let sum = 0
    let position = 0
    const keys = ibanIDs
    logger.info("Fetching accounts from Bank Frick's API...")
    const providerDataRequestedUnixMs = Date.now()
    while (keys.length > 0) {
      // TODO Fetching and processing pages can be run concurrently
      const axiosRequest = this.prepareRequest(position, req.requestContext.data, settings)
      const response = await this.makeRequest(axiosRequest, settings, signingAlgorithm)

      logger.debug(`Evaluating accounts from page ${position / PAGE_SIZE}`)
      response.data.accounts.forEach((v: Account) => {
        logger.trace(`Evaluating ${v.account} (iban: ${v.iban}, type: ${v.type})`)
        const index = ibanIDs.indexOf(v.iban)
        if (index > -1) {
          keys.splice(index, 1)
          sum += v.balance
          logger.trace(`Found account: ${v.account} (iban: ${v.iban}) with balance of ${v.balance}`)
          logger.trace(
            `Running sum: ${sum}, number of ibans left to find: ${keys.length}/${ibanIDs.length}`,
          )
        }
      })

      if (!response.data.moreResults) {
        logger.debug('No more results, breaking out of account query loop')
        break
      }
      position += PAGE_SIZE || 0
    }
    const providerDataReceivedUnixMs = Date.now()

    // 404 if one or more accounts were not found
    if (keys.length > 0) {
      throw new AdapterInputError({ statusCode: 404, message: 'Could not find all accounts' })
    }

    logger.debug('Was able to find all accounts, returning balance across all accounts: ', sum)
    const res = {
      data: {
        result: sum,
      },
      statusCode: 200,
      result: sum,
      timestamps: {
        providerDataReceivedUnixMs,
        providerDataRequestedUnixMs,
      },
    } as AdapterResponse<AccountsEndpointTypes['Response']>
    await this.cache.set(req.requestContext.cacheKey, res, settings.CACHE_MAX_AGE)
    return res
  }
}

export const accountsRestEndpoint = new AdapterEndpoint<AccountsEndpointTypes>({
  name: 'accounts',
  transport: new BankFrickAccountsTransport(),
  inputParameters,
  cacheKeyGenerator: (data) => {
    const sortedData = Object.keys(data)
      .sort()
      .reduce((a: Record<string, unknown>, i) => {
        a[i] = data[i]
        return a
      }, {})
    return `accounts-${JSON.stringify(sortedData)}`
  },
})
