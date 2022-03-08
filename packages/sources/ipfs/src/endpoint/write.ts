import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { serialize } from '../codec'
import { IPFSPath } from './read'

export const supportedEndpoints = ['write']

export const description = 'Write data to IPFS'

export const inputParameters: InputParameters = {
  data: {
    required: true,
    description: 'The data to write',
  },
  codec: {
    required: false,
    description: 'The codec to convert the data, if necessary when type is `raw`',
    type: 'string',
    options: ['json', 'dag-cbor'],
  },
  cidVersion: {
    required: false,
    description: 'The CID version to be returned',
    type: 'number',
    default: 0,
  },
  type: {
    required: false,
    description: 'The type of data to read',
    type: 'string',
    options: ['raw', 'dag'],
    default: 'raw',
  },
  format: {
    required: false,
    description: 'The DAG format to use',
    type: 'string',
    default: 'dag-cbor',
  },
  hashAlg: {
    required: false,
    description: 'The DAG hashing algorithm to use',
    type: 'string',
    default: 'sha2-256',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const data = validator.validated.data.data
  const codec = validator.validated.data.codec
  const cidVersion = validator.validated.data.cidVersion
  const type = validator.validated.data.type
  const format = validator.validated.data.format
  const hashAlg = validator.validated.data.hashAlg

  const client = create({ url: config.api.baseURL })
  const options = { cidVersion }

  let cid: IPFSPath = ''
  switch (type) {
    case 'raw':
      cid = await putFile(serialize(data, codec), client, options)
      break
    case 'dag':
      cid = await putDag(data, client, { ...options, format, hashAlg })
      break
    default:
      throw Error('Unknown type')
  }

  const response = {
    data: { result: cid, cid },
  }

  return Requester.success(jobRunID, response)
}

const putFile = async (
  data: string | Uint8Array,
  client: IPFSHTTPClient,
  options: Record<string, unknown>,
) => {
  const { cid } = await client.add(data, options)
  return cid.toString()
}

const putDag = async (
  node: Record<string, unknown>,
  client: IPFSHTTPClient,
  options: Record<string, unknown>,
): Promise<IPFSPath> => client.dag.put(node, options)
