import { ethers } from 'ethers'
import multicallAbi from '../abi/IMulticall.json'

type Aggregate3Call = {
  // Target contract to call.
  target: string
  // If false, the entire call will revert if the call fails.
  allowFailure: boolean
  // Data to call on the target contract, in Bytes
  callData: string
}

type RawAggregate3Response = [boolean, string]
type Aggregate3Response = {
  // True if the call succeeded, false otherwise.
  success: boolean
  // Return data if the call succeeded or revert data if the call reverted, in Bytes
  returnData: string
}

/**
 * Utility class for aggregating multiple static contract calls into a single eth_call.
 * Uses deployed Multicall3 (https://github.com/mds1/multicall) contract to aggregate the calls.
 *
 * Calls are encoded for the target contract function, and then sent to the Multicall3 contract aggregate3 function.
 * aggregate3 then calls the target contracts functions and aggregates the response.
 *
 * Advantages:
 * 1. Reduces number of separate RPC calls, reducing network traffic
 * 2. Guarantees all values returned are from the same block
 */
export class Multicall {
  multicall: ethers.Contract

  constructor(multicallAddress: string, provider: ethers.providers.BaseProvider) {
    this.multicall = new ethers.Contract(multicallAddress, multicallAbi, provider)
  }

  /**
   * Aggregates multiple static contract calls into a single eth_call.
   *
   * @param target - the target contract to be called
   * @param functionName - the name of the function to be called on the target contract
   * @param data - a list of request data to be sent to the function
   * @returns - a list of responses in the same order as the provided data
   */
  call = async <T>(target: ethers.Contract, functionName: string, data: T[]): Promise<any[]> => {
    const calls: Aggregate3Call[] = data.map((datum) => ({
      target: target.address,
      // Required so that we can pinpoint any individual failing calls
      allowFailure: true,
      callData: target.interface.encodeFunctionData(functionName, [datum]),
    }))

    const response: Aggregate3Response[] = await this.multicall.callStatic
      .aggregate3(calls)
      .then((result: RawAggregate3Response[]) =>
        result.map(([success, returnData]) => ({ success, returnData })),
      )

    return response.map(({ success, returnData }, i) => {
      if (!success) {
        throw new Error(
          `Multicall failed to call ${target.address} ${functionName} with ${data[i]}`,
        )
      }

      return target.interface.decodeFunctionResult(functionName, returnData)[0]
    })
  }
}
