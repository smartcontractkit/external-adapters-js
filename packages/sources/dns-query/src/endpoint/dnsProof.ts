import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { Answer, DNSProofResponseSchema } from '../types'

export const supportedEndpoints = ['dnsProof']

export const endpointResultPaths = {}

export const inputParameters: InputParameters = {
  name: {
    aliases: ['domain'],
    description: 'The domain name to check ownership of.',
    type: 'string',
    required: true,
  },
  record: {
    aliases: ['address'],
    description: 'The Ethereum address to check a given domain against.',
    type: 'string',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const name = validator.validated.data.name
  const record = validator.validated.data.record.toLowerCase()

  if (!ethers.utils.isAddress(record)) {
    throw new AdapterError({
      statusCode: 400,
      message: `The given address: ${record} is not an ethereum address.`,
    })
  }

  const params = {
    name,
    type: 'TXT',
  }
  const options = { ...config.api, params }
  const response = await Requester.request<DNSProofResponseSchema>(options)
  const answers = response.data.Answer

  if (!Array.isArray(answers)) {
    throw new AdapterError({
      jobRunID,
      statusCode: 200,
      message: `Unexpected response from API. Response: ${answers} was not an array.`,
      url: options.baseUrl,
    })
  }

  const isOwned = answers.some(({ data }: Answer) => data.toLowerCase() === record)
  response.data.result = isOwned
  return Requester.success(jobRunID, response, config.verbose)
}
