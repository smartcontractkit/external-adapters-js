import { Validator } from '@chainlink/ea-bootstrap'
import type { AdapterResponse } from '@chainlink/types'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { makeOptions } from '../config'
import { Indexer, runBalanceAdapter } from '../utils/balance'
import { runProtocolAdapter } from '../utils/protocol'
import { runReduceAdapter } from '../utils/reduce'
import { filterDuplicates, validateAddresses } from '../utils/addressValidator'
export const supportedEndpoints = ['reserves']

const paramOptions = makeOptions()

const inputParameters: InputParameters = {
  protocol: {
    required: true,
    type: 'string',
    description: 'The protocol external adapter to use',
    options: paramOptions.protocol,
  },
  indexer: {
    required: true,
    type: 'string',
    description: 'The indexer external adapter to use',
    options: paramOptions.indexer,
  },
  confirmations: {
    required: false,
    type: 'number',
    description:
      'The number of confirmations required for a transaction to be counted when getting an address balance',
    default: 6,
  },
  addresses: {
    required: false,
    type: 'array',
    description: 'An array of addresses to get the balance from, when `protocol` is set to `list`',
  },
  disableAddressValidation: {
    required: false,
    type: 'string',
    description: 'Gives the option to disable address validation before the balances are fetched.',
    default: 'false',
  },
  disableDuplicateAddressFiltering: {
    required: false,
    type: 'string',
    description:
      'Gives the option to disabled the filtering of duplicate addresses in a request. ' +
      'If this is set to `true` and a duplicate address is contained in the request, the balance of that address will be counted twice.',
    default: 'false',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters, paramOptions)
  const jobRunID = validator.validated.jobRunID
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer: Indexer = validator.validated.data.indexer.toUpperCase()
  const confirmations = validator.validated.data.confirmations
  const protocolOutput = await runProtocolAdapter(jobRunID, context, protocol, input.data, config)
  const validatedAddresses = getValidAddresses(protocolOutput, validator)
  const balanceOutput = await runBalanceAdapter(
    indexer,
    context,
    confirmations,
    config,
    validatedAddresses,
  )
  const reduceOutput = await runReduceAdapter(indexer, context, balanceOutput)
  return reduceOutput
}

const getValidAddresses = (
  protocolOutput: AdapterResponse,
  validator: Validator,
): AdapterResponse => {
  const validatedInput = { ...protocolOutput }
  if (
    !validator.validated.data.disableAddressValidation ||
    validator.validated.data.disableAddressValidation !== 'true'
  ) {
    validatedInput.result = validateAddresses(
      validator.validated.data.indexer,
      validatedInput.result,
    )
  }
  if (
    !validator.validated.data.disableDuplicateAddressFiltering ||
    validator.validated.data.disableDuplicateAddressFiltering !== 'true'
  ) {
    validatedInput.result = filterDuplicates(validatedInput.result)
  }
  validatedInput.data.result = validatedInput.result
  return validatedInput
}
