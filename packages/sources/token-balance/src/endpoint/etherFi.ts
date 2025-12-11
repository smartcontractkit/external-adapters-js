import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { etherFiBalanceTransport } from '../transport/etherFi'

export const inputParameters = new InputParameters(
  {
    splitMain: {
      required: true,
      type: 'string',
      description: 'Address of splitMain contract',
    },
    splitMainAccount: {
      required: true,
      type: 'string',
      description: 'Input to splitMain contract',
    },
    eigenStrategy: {
      required: true,
      type: 'string',
      description: 'Address of eigenStrategy contract',
    },
    eigenStrategyUser: {
      required: true,
      type: 'string',
      description: 'Input to eigenStrategy contract',
    },
    eigenPodManager: {
      type: 'string',
      description: 'EigenPodManager contract address used to query queued withdrawals',
      default: '0x39052978723eB8d29c7aE967d0a95aebF71737A7',
    },
  },
  [
    {
      splitMain: '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE',
      splitMainAccount: '',
      eigenStrategy: '0x93c4b944D05dfe6df7645A86cd2206016c51564D',
      eigenStrategyUser: '',
      eigenPodManager: '0x39052978723eB8d29c7aE967d0a95aebF71737A7',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'etherFi',
  transport: etherFiBalanceTransport,
  inputParameters,
})
