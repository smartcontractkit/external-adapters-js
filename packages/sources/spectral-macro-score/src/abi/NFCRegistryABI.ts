const ABI = {
  _format: 'hh-sol-artifact-1',
  contractName: 'INFCRegistry',
  sourceName: 'contracts/interfaces/INFCRegistry.sol',
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newAddress',
          type: 'address',
        },
      ],
      name: 'NFCUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'string',
          name: 'newNetworkId',
          type: 'string',
        },
      ],
      name: 'NetworkIdSet',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'id',
          type: 'bytes32',
        },
      ],
      name: 'getAddress',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getNFC',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getNetworkId',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'nfc',
          type: 'address',
        },
      ],
      name: 'setNFC',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'networkId',
          type: 'string',
        },
      ],
      name: 'setNetworkId',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  bytecode: '0x',
  deployedBytecode: '0x',
  linkReferences: {},
  deployedLinkReferences: {},
}

export default ABI
