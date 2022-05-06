interface BaseMessage {
  jsonrpc: string
  id?: string | number | null
}

export interface AuthenticationRequest extends BaseMessage {
  method: 'authentication_logon'
  params: {
    api_key?: string
  }
}

export interface SubscribeRequest extends BaseMessage {
  method: 'vwap_subscribe'
  params: {
    tickers?: string[]
  }
}

export interface UnsubscribeRequest extends BaseMessage {
  method: 'vwap_unsubscribe'
  params: {
    tickers?: string[]
  }
}

interface AuthenticationResponse extends BaseMessage {
  result: {
    user_id: string
  }
}

interface SubscribeResponse extends BaseMessage {
  result: {
    snapshot: {
      ticker: string
      price: number
      size: number
      volume: number
    }[]
  }
}

export interface PriceUpdateResponse extends BaseMessage {
  method: 'vwap'
  params: {
    updates: {
      ticker: string
      price?: number
      size?: number
      volume?: number
    }[]
  }
}

interface UnsubscribeResponse extends BaseMessage {
  result: Record<string, never>
}

interface ErrorResponse extends BaseMessage {
  error: {
    code: number
    message: string
    data?: string
  }
}

export type ResponseMessage =
  | AuthenticationResponse
  | ErrorResponse
  | PriceUpdateResponse
  | SubscribeResponse
  | UnsubscribeResponse
