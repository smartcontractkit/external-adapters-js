import { Requester } from '@chainlink/external-adapter-framework/util/requester'

export interface CantonClientConfig {
  AUTH_TOKEN: string
  URL: string
}

export interface QueryContractByTemplateRequest {
  templateIds: string[]
  filter?: string | Record<string, any>
}

export interface ExerciseChoiceRequest {
  contractId: string
  templateId: string
  choice: string
  argument: Record<string, any>
}

export interface Contract {
  contractId: string
  templateId: string
  payload: Record<string, any>
  signatories: string[]
  observers: string[]
  agreementText: string
  createdAt?: string
}

export interface ExerciseResult {
  completionOffset: string
  events: any[]
  exerciseResult: any
}

export interface ExerciseResponse {
  result: any
  status: number
}

export class CantonClient {
  private requester: Requester
  private config: CantonClientConfig
  private static instance: CantonClient

  constructor(requester: Requester, config: CantonClientConfig) {
    this.requester = requester
    this.config = config
  }

  static getInstance(requester: Requester, config: CantonClientConfig): CantonClient {
    if (!this.instance) {
      this.instance = new CantonClient(requester, config)
    }

    return this.instance
  }

  /**
   * Query contracts by template ID with an optional filter
   */
  async queryContractsByTemplate(request: QueryContractByTemplateRequest): Promise<Contract[]> {
    const baseURL = `${this.config.URL}/v1/query`

    const requestData: any = {
      templateIds: request.templateIds,
    }

    if (request.filter) {
      requestData.query =
        typeof request.filter === 'string' ? JSON.parse(request.filter) : request.filter
    }

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.AUTH_TOKEN}`,
      },
      data: requestData,
    }

    const response = await this.requester.request<{ result: Contract[] }>(baseURL, requestConfig)

    if (response.response?.status !== 200) {
      throw new Error(`Failed to query contracts: ${response.response?.statusText}`)
    }

    const contracts = response.response.data.result

    // When a filter is provided, it should return exactly one contract
    if (request.filter && contracts.length > 1) {
      throw new Error(
        `Filter query returned ${contracts.length} contracts, but expected exactly 1. `,
      )
    }

    return contracts
  }

  /**
   * Exercise a non-consuming choice on a contract
   */
  async exerciseChoice(payload: ExerciseChoiceRequest): Promise<ExerciseResult> {
    const baseURL = `${this.config.URL}/v1/exercise`

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.AUTH_TOKEN}`,
      },
      data: payload,
    }

    const response = await this.requester.request<ExerciseResponse>(baseURL, requestConfig)

    if (response.response?.status !== 200) {
      throw new Error(`Failed to exercise choice: ${response.response?.statusText}`)
    }

    return response.response.data.result
  }
}
