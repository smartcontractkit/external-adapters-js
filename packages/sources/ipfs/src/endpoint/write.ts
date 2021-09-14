import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { serialize } from '../codec'
import { IPFSPath } from './read'

export const supportedEndpoints = ['write']

const customParams = {
  data: true,
  codec: false,
  cidVersion: false,
  type: false,
  format: false,
  hashAlg: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const data = validator.validated.data.data
  const codec = validator.validated.data.codec
  const cidVersion = validator.validated.data.cidVersion || 0
  const type = validator.validated.data.type || 'raw'
  const format = validator.validated.data.format || 'dag-cbor'
  const hashAlg = validator.validated.data.hashAlg || 'sha2-256'

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
  options: Record<string, any>,
) => {
  const { cid } = await client.add(data, options)
  return cid.toString()
}

const putDag = async (
  node: Record<string, any>,
  client: IPFSHTTPClient,
  options: Record<string, any>,
): Promise<IPFSPath> => client.dag.put(node, options)
