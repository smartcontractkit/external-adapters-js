export type DNSQuestion = {
  name: string
  type: number
}

export type DNSAnswer = {
  name: string
  type: number
  TTL: number
  data: string
}

export type DNSQueryResponse = {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: DNSQuestion[]
  Answer: DNSAnswer[]
  Comment?: string
}
