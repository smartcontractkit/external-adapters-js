import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { TransactionStatus } from '@superstateinc/api-key-request'
import { config } from '../config'
import { transactionsTransport } from '../transport/transactions'
import { ResponseSchema } from '../transport/transactionUtils'
import { DEFAULT_END_TIME, DEFAULT_START_TIME } from '../transport/utils'
import { validateTime } from './utils'

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
    transactionStatus: {
      description: 'Used to query transaction_status',
      type: 'string',
      required: true,
      options: Object.values(TransactionStatus),
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
    startTime: {
      description:
        'Start of the daily window (HH:mm:ss) during which the data provider is polled for a fresh value',
      type: 'string',
      default: DEFAULT_START_TIME,
    },
    endTime: {
      description:
        'End of the daily window (HH:mm:ss) during which the data provider is polled for a fresh value',
      type: 'string',
      default: DEFAULT_END_TIME,
    },
  },
  [
    {
      fundId: 1,
      ticker: 'tickerName',
      transactionStatus: TransactionStatus.Completed,
      operations: ['open'],
      decimals: 18,
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
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
  customInputValidation: (req, settings): AdapterError | undefined => {
    const { startTime, endTime } = req.requestContext.data
    validateTime(startTime, endTime)

    if (!settings.TRANSACTION_API_KEY || !settings.TRANSACTION_API_SECRET) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing TRANSACTION_API_KEY or TRANSACTION_API_SECRET environment variables.`,
      })
    }
    return
  },
})
