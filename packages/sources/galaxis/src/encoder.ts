import { ByteArray } from '@ethercards/ec-util'

export const callToRequestData = (calls: string[][], dataRecordId: number): string => {
  let bytes = ''
  const header = new ByteArray(Buffer.alloc(2))
  // add call num
  header.writeUnsignedShort(calls.length)
  // add record id
  header.writeUnsignedInt(dataRecordId)
  bytes = header.toString('hex')

  for (let i = 0; i < calls.length; i++) {
    const callLen = callLentoHex(removeZeroX(calls[i][1]).length)
    const address = addresstoCallData(calls[i][0])
    const callData = removeZeroX(calls[i][1])
    const packet = callLen + address + callData
    bytes += packet
  }
  return bytes
}

const removeZeroX = (str: string): string => {
  return str.replace('0x', '')
}

const addresstoCallData = (str: string): string => {
  return '000000000000000000000000' + removeZeroX(str)
}

const callLentoHex = (num: number): string => {
  const data = new ByteArray(Buffer.alloc(2))
  data.writeUnsignedShort(num / 2)
  return removeZeroX(data.toString('hex'))
}
