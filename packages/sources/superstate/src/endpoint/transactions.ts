import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { transactionsTransport } from '../transport/transactions'
import { ResponseSchema } from '../transport/transactionUtils'

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Used to fetch Net Asset Value',
      type: 'number',
      required: true,
    },
    ticker: {
      description: 'Used to fetch transactions',
      type: 'string',
      required: true,
    },
    operations: {
      description: 'Used to match transactions operation_type',
      type: 'string',
      array: true,
      required: true,
    },
    decimals: {
      description: 'Number of decimals of response',
      type: 'number',
      required: true,
    },
  },
  [
    {
      fundId: 1,
      ticker: 'tickerName',
      operations: ['open'],
      decimals: 18,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      transactions: ResponseSchema[]
      navPrice: number
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'transactions',
  inputParameters,
  transport: transactionsTransport,
  customInputValidation: (_, settings): AdapterError | undefined => {
    if (!settings.TRANSACTION_API_KEY || !settings.TRANSACTION_API_SECRET) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing TRANSACTION_API_KEY or TRANSACTION_API_SECRET environment variables.`,
      })
    }
    return
  },
})
