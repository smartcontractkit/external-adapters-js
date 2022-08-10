import { AxiosRequestConfig, Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import type { Config } from '../config'
import { Account } from '../types'
import * as https from 'https'
import crypto from 'crypto'
import { setToken } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint.
// The supportedEndpoints list must be present for README generation.
export const supportedEndpoints = ['accounts']
export const batchablePropertyPath = [{ name: 'ibanIds' }]

export const endpointResultPaths = {
  accounts: 'accounts',
}

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
//Sandbox uses invalid ibans, so this is a VERY shallow pattern
const ibanPattern = /^[A-Z]{2}[A-Z\d]{14,30}$/ //https://stackoverflow.com/questions/44656264/iban-regex-design
const customError = (data: ResponseSchema) => Array.isArray(data.errors) && data.errors.length > 0
const customTokenResponseError = (data: TokenResponseSchema) =>
  Array.isArray(data.errors) && data.errors.length > 0
// const authCustomError = (data: TokenResponseSchema) => data.Response === 'Error'

// The description string is used to explain how the endpoint works, and is used for part of the endpoint's README section
export const description =
  'This endpoint returns the sum of all balances for accounts specified by the user.'

// The inputParameters object must be present for README generation.
export type TInputParameters = { ibanIDs: string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  // See InputParameters type for more config options
  ibanIDs: {
    description: 'The list of account ids included in the sum of balances',
    required: true,
    type: 'array',
  },
}

export const generateJWT = async (config: Config): Promise<string> => {
  Logger.info("Generating a new JWT because we don't have one in config.token")
  const { apiKey, password, privateKey, signingAlgorithm } = config

  const body = {
    key: apiKey,
    password: password,
  }

  const signature = crypto.sign(
    config.signingAlgorithm,
    Buffer.from(JSON.stringify(body)),
    privateKey,
  )
  const options: AxiosRequestConfig = {
    ...config.api,
    method: 'POST',
    url: `authorize`,
    headers: {
      Signature: signature.toString('base64'),
      algorithm: signingAlgorithm,
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), //TODO Not acceptable for production
    data: body,
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

  const { ibanIDs } = validator.validated.data

  // Strip duplicates with a set, then validate that all input iban numbers are good
  // This is redundant in function, because a duped or invalid iban would result in an error AFTER the api call.
  // This bit of validation instead prevents the API from being called on invalid input
  Logger.trace('Validating IbanIDs')
  const validatedIbanIds = [...new Set(ibanIDs)].map((v) => {
    if (!v.match(ibanPattern)) {
      throw new Error(`Invalid iban provided: ${v}`)
    }
    return v
  })

  const headers = {
    // Authorization: `Bearer ${generateJWT(config, signingAlgorithm)}`
    Authorization: `Bearer ${config.token || (await generateJWT(config))}`,
  }

  const options: AxiosRequestConfig = {
    ...config.api,
    headers,
    url,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), //TODO Not acceptable for production
  }
  let position = 0 //What record we're on
  let sum = 0 //Return value if all queried accounts found
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
    response.data.accounts.forEach((v) => {
      Logger.trace(`Evaluating ${v.account} (iban: ${v.iban}, type: ${v.type})`)
      const index = keys.indexOf(v.iban)
      if (index > -1) {
        keys.splice(index, 1)
        sum += v.balance
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
    throw new Error(`Could not find data for the following accounts ${keys}`)
  }
  Logger.debug(`Finished fetching account balances, sum: ${sum}`)
  return Requester.success(jobRunID, { data: { result: sum } }, config.verbose)
}
