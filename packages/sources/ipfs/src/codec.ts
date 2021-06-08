import * as dagCBOR from 'ipld-dag-cbor'

export const CODEC_DAG_CBOR = 'dag-cbor'
export const CODEC_JSON = 'json'

// eslint-disable-next-line @typescript-eslint/ban-types
export const serialize = (data: string | object, codec?: string): string | Uint8Array => {
  if (typeof data !== 'string' && !codec) {
    throw Error(`Unable to serialize object without codec`)
  }
  if (typeof data === 'string' && !codec) return data

  switch (codec) {
    case CODEC_DAG_CBOR:
      if (typeof data === 'string') throw Error(`${CODEC_DAG_CBOR} codec cannot serialize strings`)
      return dagCBOR.util.serialize(data)
    case CODEC_JSON:
      return Buffer.from(JSON.stringify(data))
  }

  throw Error(`Unknown codec: ${codec}`)
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const deserialize = (data: Buffer, codec?: string): string | object => {
  if (!codec) return data.toString()

  switch (codec) {
    case CODEC_DAG_CBOR:
      return dagCBOR.util.deserialize(data)
    case CODEC_JSON:
      return JSON.parse(data.toString())
  }

  throw Error(`Unknown codec: ${codec}`)
}
