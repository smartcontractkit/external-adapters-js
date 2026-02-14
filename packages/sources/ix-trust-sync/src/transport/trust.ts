import { createClient, Client } from '@libsql/client'
import { getAddress, verifyTypedData } from 'ethers'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes, inputParameters } from '../endpoint/trust'

const logger = makeLogger('IxTrustSyncTransport')

const ATTESTATION_QUERY = `
WITH latest_attestation AS (
  SELECT
    ca.contract_deployment_id,
    ca.attestor_address,
    ca.attestation_data,
    ca.signature,
    ca.created_at                      AS attestor_timestamp,
    json_extract(ca.attestation_data, '$.message.navContractAddress')  AS nav_contract_address,
    json_extract(ca.attestation_data, '$.message.decimals')            AS attested_decimals,
    json_extract(ca.attestation_data, '$.message.cumulativeAmount')    AS cumulative_amount_wei
  FROM contract_attestations ca
  JOIN contract_deployments cd ON cd.id = ca.contract_deployment_id
  WHERE ca.deleted = 0
    AND ca.status = 'active'
    AND ca.attestation_type = 'net_asset_value'
    AND LOWER(ca.attestor_address) = LOWER(:auditor_address)
    AND LOWER(cd.contract_address) = LOWER(:fractional_address)
    AND cd.chain_id = :chain_id
  ORDER BY ca.created_at DESC
  LIMIT 1
)
SELECT
  frac_cd.chain_id,
  frac_cd.contract_address                       AS fractional_contract_address,
  frac_cd.contract_name                          AS fractional_unit,
  la.nav_contract_address,
  nav_cd.contract_address                        AS nav_contract_address_verified,
  la.attested_decimals,
  la.cumulative_amount_wei,
  CAST(la.cumulative_amount_wei AS REAL) / POWER(10, la.attested_decimals) AS cumulative_amount_human,
  la.attestor_address                            AS auditor_account_address,
  la.signature                                   AS auditor_signature,
  la.attestation_data,
  la.attestor_timestamp
FROM latest_attestation la
JOIN contract_deployments frac_cd ON frac_cd.id = la.contract_deployment_id
JOIN contract_deployments nav_cd  ON LOWER(nav_cd.contract_address) = LOWER(la.nav_contract_address);
`

export class IxTrustSyncTransport implements Transport<BaseEndpointTypes> {
  name!: string
  client!: Client
  responseCache!: ResponseCache<BaseEndpointTypes>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: typeof config.settings,
    _endpointName: string,
    name: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = name
    this.client = createClient({
      url: adapterSettings.TURSO_DATABASE_URL,
      authToken: adapterSettings.TURSO_AUTH_TOKEN,
    })
    logger.info('Turso client initialized')
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    _settings: typeof config.settings,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const { chain_id, auditor_address, fractional_contract_address } = req.requestContext.data
    const providerDataRequestedUnixMs = Date.now()

    try {
      const queryResult = await this.client.execute({
        sql: ATTESTATION_QUERY,
        args: {
          auditor_address,
          fractional_address: fractional_contract_address,
          chain_id,
        },
      })

      const providerDataReceivedUnixMs = Date.now()

      if (queryResult.rows.length === 0) {
        return {
          statusCode: 502,
          errorMessage: `No attestation found for chain_id=${chain_id}, auditor=${auditor_address}, fractional=${fractional_contract_address}`,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs,
            providerIndicatedTimeUnixMs: undefined,
          },
        }
      }

      const row = queryResult.rows[0]
      const signature = String(row.auditor_signature)
      const attestationDataJson = String(row.attestation_data)

      // Parse the full EIP-712 typed data stored in the database
      const typedData = JSON.parse(attestationDataJson)

      // Extract EIP-712 components for verification
      // Strip EIP712Domain from types — ethers adds it automatically
      const { EIP712Domain: _, ...messageTypes } = typedData.types
      const domain = {
        name: typedData.domain.name,
        version: typedData.domain.version,
        chainId: Number(typedData.domain.chainId),
        verifyingContract: getAddress(typedData.domain.verifyingContract),
      }

      // Checksum any address fields in the message so ethers doesn't reject mixed-case
      const checksummedMessage = { ...typedData.message }
      const primaryType = typedData.primaryType as string
      const typeFields = messageTypes[primaryType] || []
      for (const field of typeFields) {
        if (field.type === 'address' && checksummedMessage[field.name]) {
          checksummedMessage[field.name] = getAddress(checksummedMessage[field.name])
        }
      }

      // Recover the signer address from the EIP-712 signature
      const recoveredAddress = verifyTypedData(domain, messageTypes, checksummedMessage, signature)

      // Verify the recovered address matches the requested auditor
      if (recoveredAddress.toLowerCase() !== auditor_address.toLowerCase()) {
        return {
          statusCode: 502,
          errorMessage: `Signature verification failed: recovered ${recoveredAddress}, expected ${auditor_address}`,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs,
            providerIndicatedTimeUnixMs: undefined,
          },
        }
      }

      // Extract the cumulative amount from the cryptographically verified message
      const result = Number(typedData.message.cumulativeAmount)

      logger.info(
        `Verified attestation from ${recoveredAddress} — cumulativeAmount=${result}`,
      )

      const response = {
        data: {
          result,
        },
        result,
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      return response as AdapterResponse<BaseEndpointTypes['Response']>
    } catch (error) {
      const providerDataReceivedUnixMs = Date.now()
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Attestation verification failed: ${errorMessage}`)

      return {
        statusCode: 502,
        errorMessage: `Attestation verification failed: ${errorMessage}`,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
  }
}

export const transport = new IxTrustSyncTransport()
