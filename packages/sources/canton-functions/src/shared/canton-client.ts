import { Requester } from '@chainlink/external-adapter-framework/util/requester'

export interface CantonClientConfig {
  JSON_API: string
  AUTH_TOKEN: string
}

export interface QueryContractRequest {
  templateIds: string[]
}

export interface Contract {
  contractId: string
  templateId: string
  payload: Record<string, any>
  signatories: string[]
  observers: string[]
  agreementText: string
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
   * Query contracts by template ID
   */
  async queryContracts(request: QueryContractRequest): Promise<Contract[]> {
    const baseURL = `${this.config.JSON_API}/v1/query`

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.AUTH_TOKEN}`,
      },
      data: request,
    }

    const response = await this.requester.request<{ result: Contract[] }>(baseURL, requestConfig)

    //todo: check for other error codes
    if (response.response?.status !== 200) {
      throw new Error(`Failed to query contracts: ${response.response?.statusText}`)
    }

    return response.response.data.result
  }
}
