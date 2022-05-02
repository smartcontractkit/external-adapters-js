import { Validator } from '@chainlink/ea-bootstrap'
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
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters, paramOptions)
  const jobRunID = validator.validated.jobRunID
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer: Indexer = validator.validated.data.indexer.toUpperCase()
  const confirmations = validator.validated.data.confirmations

  const protocolOutput = await runProtocolAdapter(jobRunID, context, protocol, input.data, config)
  const validatedInput = { ...protocolOutput }
  if (
    validator.validated.data.disableAddressValidation &&
    validator.validated.data.disableAddressValidation !== 'false'
  )
    validatedInput.result = validateAddresses(indexer, validatedInput.result)
  if (
    validator.validated.data.disableDuplicateAddressFiltering &&
    validator.validated.data.disableDuplicateAddressFiltering !== 'false'
  )
    validatedInput.result = filterDuplicates(validatedInput.result)
  validatedInput.data.result = validatedInput.result
  const balanceOutput = await runBalanceAdapter(
    indexer,
    context,
    confirmations,
    config,
    validatedInput,
  )
  const reduceOutput = await runReduceAdapter(indexer, context, balanceOutput)
  return reduceOutput
}
