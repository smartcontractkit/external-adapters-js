import { AxiosRequestConfig, Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import type { Config } from '../config'
import { Account, SigningAlgorithm } from '../types'
import * as https from 'https'
import * as crypto from 'crypto'
import { setToken } from '../config'
import { AdapterInputError } from '@chainlink/ea-bootstrap/dist'
import { Decimal } from 'decimal.js-light'

// This should be filled in with a lowercase name corresponding to the API endpoint.
// The supportedEndpoints list must be present for README generation.
export const supportedEndpoints = ['accounts']
export const endpointResultPaths = {
  accounts: 'accounts',
}

//The ResponseSchema here can be placed in types.ts as "Accounts" if we add new endpoints
export interface ResponseSchema {
  errors?: string[]
  date: Date
  moreResults: boolean
  resultSetSize: number
  accounts: Account[]
}

export interface TokenResponseSchema {
  errors?: string[]
  token: string
}

//Sandbox uses invalid ibans, so this is a VERY shallow pattern that only checks for a country code
//See //https://stackoverflow.com/questions/44656264/iban-regex-design for the full pattern
const ibanPattern = /^[A-Z]{2}[A-Z\d]{14,30}$/
const customError = (data: ResponseSchema) => Array.isArray(data.errors) && data.errors.length > 0
const customTokenResponseError = (data: TokenResponseSchema) =>
  Array.isArray(data.errors) && data.errors.length > 0

// The description string is used to explain how the endpoint works, and is used for part of the endpoint's README section
export const description =
  'This endpoint returns the sum of all balances for accounts specified by the user.'

// The inputParameters object must be present for README generation.
export type TInputParameters = { ibanIDs: string[]; signingAlgorithm?: SigningAlgorithm }
export const inputParameters: InputParameters<TInputParameters> = {
  // See InputParameters type for more config options
  ibanIDs: {
    description: 'The list of account ids included in the sum of balances',
    required: true,
    type: 'array',
  },
  signingAlgorithm: {
    description:
      'What signing algorithm is used to sign and verify authorization data, one of rsa-sha256, rsa-sha384, or rsa-sha512',
    required: false,
    type: 'string',
    default: 'rsa-sha512',
  },
}

export const generateJWT = async (
  config: Config,
  signingAlgorithm: SigningAlgorithm = 'rsa-sha512',
): Promise<string> => {
  Logger.info("Generating a new JWT because we don't have one in config.token")
  const { apiKey, privateKey } = config

  const body = {
    key: apiKey,
  }

  const signature = crypto.sign(signingAlgorithm, Buffer.from(JSON.stringify(body)), privateKey)
  const options: AxiosRequestConfig = {
    ...config.api,
    method: 'POST',
    url: `authorize`,
    headers: {
      Signature: signature.toString('base64'),
      algorithm: signingAlgorithm,
    },
    data: body,
  }
  if (config.allowInsecure) {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  }
  Logger.debug('Signature: ', signature)
  const response = await Requester.request<TokenResponseSchema>(options, customTokenResponseError)
  setToken(response.data.token) //Sets token at config level for future runs

  return response.data.token
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const url = `accounts`

  const { ibanIDs, signingAlgorithm } = validator.validated.data

  // Strip duplicates with a set, then validate that all input IBANs are good which avoids an API call on bad input.
  Logger.trace('Validating ibanIDs...')
  const validatedIbanIds = [...new Set(ibanIDs)].map((v) => {
    if (!v.match(ibanPattern)) {
      throw new AdapterInputError({
        jobRunID: validator.validated.id,
        statusCode: 400,
        message: `Invalid IBAN provided: ${v}`,
      })
    }
    return v
  })

  const headers = {
    // Authorization: `Bearer ${generateJWT(config, signingAlgorithm)}`
    Authorization: `Bearer ${config.token || (await generateJWT(config, signingAlgorithm))}`,
  }

  const options: AxiosRequestConfig = {
    ...config.api,
    headers,
    url,
  }

  if (config.allowInsecure) {
    //Bypasses cert issues with the sandbox, only available when NODE_ENV is development
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  }

  let position = 0 //What record we're on
  let sum = new Decimal(0) //Return value if all queried accounts found
  const keys = validatedIbanIds //Stack of keys that we need to find, used to

  //Iterate through all accounts to find ones with IBAN's matching the ones specified in the input params
  //Stop when we've found all accounts OR there's no more results
  while (keys.length > 0) {
    Logger.trace(`Page: ${position / config.pageSize}, position: ${position}`)

    options.params = {
      firstPosition: position,
      maxResults: config.pageSize,
    }

    const response = await Requester.request<ResponseSchema>(options, customError)

    if (!response.data.accounts) {
      Logger.info(`Account data not present in the Bank Frick response. Raw: ${response.data}`)
      throw new AdapterInputError({
        jobRunID: validator.validated.id,
        statusCode: 500,
        message: `Received an undefined accounts array when fetching account pages from bank frick. Is PAGE_SIZE set between 1 and 500?`,
      })
    }

    response.data.accounts.forEach((v) => {
      Logger.trace(`Evaluating ${v.account} (iban: ${v.iban}, type: ${v.type})`)
      const index = keys.indexOf(v.iban)
      if (index > -1) {
        keys.splice(index, 1)
        sum = sum.plus(new Decimal(v.balance))
        Logger.debug(`Found account: ${v.account} (iban: ${v.iban}) with balance of ${v.balance}`)
        Logger.trace(
          `Running sum: ${sum}, number of ibans left to find: ${keys.length}/${validatedIbanIds}`,
        )
      }
    })

    position += config.pageSize
    if (!response.data.moreResults) break
  }

  //If we couldn't find all the accounts the user specified, it's an error
  if (keys.length > 0) {
    throw new AdapterInputError({
      jobRunID: validator.validated.id,
      statusCode: 404,
      message: `Could not find data for the following accounts ${keys}`,
    })
  }
  Logger.debug(`Finished fetching account balances, sum: ${sum}`)
  return Requester.success(jobRunID, { data: { result: sum } }, config.verbose)
}
