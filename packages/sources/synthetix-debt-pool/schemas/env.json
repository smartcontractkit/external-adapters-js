{
  "$id": "https://external-adapters.chainlinklabs.com/schemas/synthetix-debt-pool-adapter.json",
  "title": "Chainlink External Adapter for Synthetix-debt-pool",
  "description": "The Synthetix debt pool adapter fetches the total debt from the DebtCache contract.The environment variables bellow are not required to start the adapter but are required when you want to pull the debt from that chain. Not setting any will not prevent the adapter from starting but it won't be able to pull debt from any chains.",
  "required": [],
  "type": "object",
  "properties": {
    "ETHEREUM_RPC_URL": {
      "type": "string",
      "description": "A valid Ethereum Mainnet RPC URL"
    },
    "ETHEREUM_ADDRESS_PROVIDER_CONTRACT_ADDRESS": {
      "type": "string",
      "description": "The address of the address provider contract in ethereum"
    },
    "OPTIMISM_RPC_URL": {
      "type": "string",
      "description": "A valid Ethereum Mainnet RPC URL"
    },
    "OPTIMISM_ADDRESS_PROVIDER_CONTRACT_ADDRESS": {
      "type": "string",
      "description": "The address of the address provider contract in ethereum"
    }
  },
  "allOf": [
    {
      "$ref": "https://external-adapters.chainlinklabs.com/schemas/ea-bootstrap.json"
    }
  ]
}
