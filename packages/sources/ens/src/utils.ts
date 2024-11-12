import { ethers } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'
import * as abis from './abi'

export interface ENSContracts {
  Controller: ethers.Contract
  Registry: ethers.Contract
  Registrar: ethers.Contract
  PublicResolver: ethers.Contract
}
export const initializeENS = async (
  provider: ethers.providers.JsonRpcProvider,
): Promise<ENSContracts> => {
  const registrarAddress = await getRegistrar(provider)
  Logger.debug(`ENS Registrar address: ${registrarAddress}`)
  const Registrar = new ethers.Contract(registrarAddress, abis.RegistrarABI.default, provider)

  const registryAddress = await getRegistry(Registrar)
  Logger.debug(`ENS Registry address: ${registryAddress}`)
  const Registry = await new ethers.Contract(registryAddress, abis.RegistryABI.default, provider)

  const publicResolverAddress = await getPublicResolver(provider)
  Logger.debug(`ENS Public Resolver address: ${publicResolverAddress}`)
  const PublicResolver = await new ethers.Contract(
    publicResolverAddress,
    abis.ResolverABI.default,
    provider,
  )

  const controllerAddress = await getController(PublicResolver)
  Logger.debug(`ENS Controller address: ${controllerAddress}`)
  const Controller = await new ethers.Contract(
    controllerAddress,
    abis.ControllerABI.default,
    provider,
  )

  return {
    Registrar,
    Controller,
    Registry,
    PublicResolver,
  }
}

export const getRegistrar = async (provider: ethers.providers.JsonRpcProvider): Promise<string> => {
  const registrarAddress = await provider.resolveName('eth')
  if (!registrarAddress) throw Error('')
  return registrarAddress
}

export const getRegistry = (registrar: ethers.Contract): Promise<string> => registrar.ens()

export const getPublicResolver = async (
  provider: ethers.providers.JsonRpcProvider,
): Promise<string> => {
  const resolverAddress = await provider.resolveName('resolver.eth')
  if (!resolverAddress) throw Error('')
  return resolverAddress
}

export const getController = (resolver: ethers.Contract): Promise<string> => {
  const ethNodehash = ethers.utils.namehash('eth')
  const controllerInterfaceId = '0x018fac06'
  return resolver.interfaceImplementer(ethNodehash, controllerInterfaceId)
}
