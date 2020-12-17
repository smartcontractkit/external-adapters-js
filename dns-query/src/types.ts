export type DNSResponseQuestion = {
  name: string
  type: number
}

export type DNSResponseAnswer = {
  name: string
  type: number
  TTL: number
  data: string
}

export type DNSResponse = {
  Status: number
  Question: DNSResponseQuestion[]
  Answer: DNSResponseAnswer[]
}
