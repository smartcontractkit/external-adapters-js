import { Requester } from '@chainlink/external-adapter-framework/util/requester'

export interface CantonClientConfig {
  AUTH_TOKEN: string
}

export interface QueryContractByTemplateRequest {
  templateIds: string[]
  filter?: string | Record<string, any>
}

export interface QueryContractByIdRequest {
  contractId: string
  templateId: string
}

export interface ExerciseChoiceRequest {
  contractId: string
  templateId: string
  choice: string
  argument?: string
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
  exerciseResult: any
  events: any[]
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
  async queryContractsByTemplate(
    url: string,
    request: QueryContractByTemplateRequest,
  ): Promise<Contract[]> {
    const baseURL = `${url}/v1/query`

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

    return response.response.data.result
  }

  /**
   * Query contract by template ID and contract ID
   */
  async queryContractById(
    url: string,
    request: QueryContractByIdRequest,
  ): Promise<Contract | null> {
    const baseURL = `${url}/v1/query`

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.AUTH_TOKEN}`,
      },
      data: {
        templateIds: [request.templateId],
      },
    }

    const response = await this.requester.request<{ result: Contract[] }>(baseURL, requestConfig)

    if (response.response?.status !== 200) {
      throw new Error(`Failed to query contracts: ${response.response?.statusText}`)
    }

    const contracts = response.response.data.result
    const contract = contracts.find((c) => c.contractId === request.contractId)

    return contract || null
  }

  /**
   * Exercise a non-consuming choice on a contract
   */
  async exerciseChoice(url: string, request: ExerciseChoiceRequest): Promise<ExerciseResult> {
    const baseURL = `${url}/v1/exercise`

    const requestData: any = {
      templateId: request.templateId,
      contractId: request.contractId,
      choice: request.choice,
    }

    if (request.argument) {
      requestData.argument = JSON.parse(request.argument)
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

    const response = await this.requester.request<ExerciseResult>(baseURL, requestConfig)

    if (response.response?.status !== 200) {
      throw new Error(`Failed to exercise choice: ${response.response?.statusText}`)
    }

    return response.response.data
  }
}
