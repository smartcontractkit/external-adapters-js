/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from 'fs'
import * as Parser from 'json-schema-ref-parser'
import * as path from 'path'
import { snakeCase } from 'snake-case'
import { getWorkspacePackages } from '../workspace'
import { collisionPackageTypeMap, forceRenameMap, getCollisionIgnoreMapFrom } from './config'

export async function writeAllFlattenedSchemas() {
  const data = await flattenAllSchemas()
  data.forEach(({ location, schema }) => {
    writeFileSync(location, JSON.stringify(schema))
  })
}

export interface FlattenedSchema {
  location: string
  schema: any
}

/**
 * Get a Map of all JSON schemas belonging to EA's and flatten them by doing
 * the following:
 *
 * - Dereference all refs
 * - Merge "allOf" properties into a top level object
 * - Resolve key collisions if configured to do so
 */
export async function flattenAllSchemas(): Promise<FlattenedSchema[]> {
  const resolve = createChainlinkLabsResolver()
  const workspacePackages = getWorkspacePackages(['core'])
  const bootstrapPackage = workspacePackages.find((p) => p.descopedName === 'ea-bootstrap')
  if (!bootstrapPackage) {
    throw Error('Could not find bootstrap package to generate collisionIgnoreMap')
  }

  const pkgs = await Promise.all(
    workspacePackages
      .filter((p) => p.type !== 'core')
      .map(async (p) => {
        const { environment, location } = p
        if (!environment) {
          return
        }

        const schema = await Parser.default.dereference(environment.$id, {
          resolve,
        })

        const collisionIgnoreMap = getCollisionIgnoreMapFrom(bootstrapPackage)

        try {
          return {
            schema: flattenAllOf(
              schema,
              p.type,
              collisionIgnoreMap,
              forceRenameMap,
              collisionPackageTypeMap,
            ),
            location,
          }
        } catch (e) {
          throw Error(`Errors incurred while processing package:${location}: ${e.message}`)
        }
      }),
  )

  return pkgs.filter((obj): obj is FlattenedSchema => !!obj)
}

/**
 * Create a "json-schema-ref-parser" compatible resolver that matches URLs for https://external-adapters.chainlinklabs.com and returns internal schemas
 *
 * @returns Resolver for chainlink labs schemas
 */
function createChainlinkLabsResolver() {
  const schemas = getWorkspacePackages(['core'])
    .map((p) => p.environment)
    .filter((schema): schema is Record<string, string> => !!schema)

  const schemasById = schemas.reduce<Record<string, Record<string, string>>>((prev, next) => {
    const id = next['$id']
    if (!id) {
      console.warn(`$id not found for ${JSON.stringify(next, null, 1)}`)
      return prev
    }

    prev[id] = next
    return prev
  }, {})

  const resolver: Parser.ResolverOptions = {
    order: 1,
    canRead: /^https:\/\/external-adapters.chainlinklabs.com/i,
    read: (file, callback) => {
      if (!callback) {
        console.error('[resolver] No callback found')
        return
      }
      const data = schemasById[file.url]
      if (!data) {
        return callback(Error(`Could not find file for ${file.url}`), null)
      }

      callback(null, JSON.stringify(data))
    },
  }

  return { chainlinkLabsResolver: resolver }
}

/**
 * Recursively merge all subschema properties within the "allOf" union in a json-schema document into a top level properties object.
 *
 * @param document The document to flatten
 * @param packageType The type of the package that contains the passed document
 * @param collisionIgnoreMap When a key collision is found, if the key is contained within this allowMap then it is ignored
 * @param forceRenameMap When a key matching this Map is found, it is treated as a collision and renamed via namespacing
 * @param collisionPackageTypeMap If the package type is contained within this Map, then any collisions will also apply to the original key property
 * @returns The flattened document
 */
function flattenAllOf(
  document: any,
  packageType: string,
  collisionIgnoreMap: Record<string, true>,
  forceRenameMap: Record<string, true>,
  collisionPackageTypeMap: Record<string, true>,
) {
  function traverseAndMergeProperties(document: any, mergedProperties: Record<string, string>) {
    if (!document.properties) {
      return mergedProperties
    }
    const newProperties = mergeProperties(
      packageType,
      mergedProperties,
      document.properties,
      collisionIgnoreMap,
      forceRenameMap,
      collisionPackageTypeMap,
      document.$id,
    )
    if (!document.allOf) {
      return newProperties
    }

    return document.allOf.reduce((prev: any, subschema: any) => {
      if (!subschema.properties) {
        return prev
      }

      return traverseAndMergeProperties(subschema, prev)
    }, newProperties)
  }

  return traverseAndMergeProperties(document, {})
}

/**
 * Namespace a property to reduce chances of a key collision
 *
 * @param collisionNamespace A namespace like "https://external-adapters.chainlinklabs.com/schemas/genesis-volatility-adapter.json"
 * @param key A key like "API_KEY"
 *
 * @returns A key like "GENESIS_VOLATILITY_API_KEY"
 */
export function namespaceProperty(collisionNamespace: string, key: string): string {
  const numberMap: Record<number, string> = {
    1: 'ONE',
    2: 'TWO',
    3: 'THREE',
    4: 'FOUR',
    5: 'FIVE',
    6: 'SIX',
    7: 'SEVEN',
    8: 'EIGHT',
    9: 'NINE',
    0: 'ZERO',
  }
  const { name } = path.parse(collisionNamespace)
  const snakedName = snakeCase(name).toUpperCase()

  // handle edge case when the namespace will start with a number
  // which is an invalid environment variable
  const numberCollision = numberMap[Number(snakedName[0])]
  const resnakedName = numberCollision ? `${numberCollision}${snakedName.slice(1)}` : snakedName

  return `${resnakedName}_${key}`
}

/**
 * Merge the properties of two objects.
 *
 * Assumptions:
 * - Base properties are never modified
 * - The first invocation of this function has the base property be an empty object
 *
 * @param basePackageType The package type that the base properties originated from
 * @param base The base properties
 * @param additional The additional properties to merge into the base
 * @param collisionIgnoreMap A record of properties that will be ignored if a collision is found, ex. no collision namespace will be used. This has precedence over all other collision / force rename options
 * @param forceRenameMap A Map of keys that will be treated as a collision even if one does not exist
 * @param collisionPackageTypeMap If the package type is contained within this Map, then any collisions will also apply to the original key property
 * @param collisionNamespace The namespace to prefix additional properties by if a collision is found, and the collision is not in the collision AllowMap
 */
export function mergeProperties(
  basePackageType: string,
  base: Record<string, any>,
  additional: Record<string, any>,
  collisionIgnoreMap: Record<string, true>,
  forceRenameMap: Record<string, true>,
  collisionPackageTypeMap: Record<string, true>,
  collisionNamespace: string,
): any {
  // works for plain ol json with no circular refs
  const baseCopy = JSON.parse(JSON.stringify(base))
  const originalKeyMap: Record<string, true> = Object.values(base).reduce((prev, next) => {
    if (!next.originalKey) {
      return prev
    }
    prev[next.originalKey] = true
    return prev
  }, {})
  const originalKeyErrors: string[] = []
  for (const [k, v] of Object.entries(additional)) {
    // if we have a key collision, or we're forced to rename
    if (baseCopy[k] || forceRenameMap[k]) {
      if (collisionIgnoreMap[k]) {
        continue
      }
      const namespacedKey = namespaceProperty(collisionNamespace, k)
      if (baseCopy[namespacedKey]) {
        // this should never happen
        throw Error(`Key collision detected on namespaced property ${namespacedKey}`)
      }

      // store the pre-namedspaced key as a property, unless its contained in our package map
      const originalKey = collisionPackageTypeMap[basePackageType] ? namespacedKey : k
      baseCopy[namespacedKey] = {
        ...v,
        originalKey,
      }
      if (originalKeyMap[originalKey]) {
        originalKeyErrors.push(`Key collision detected for ${originalKey}`)
      }
      originalKeyMap[originalKey] = true
    } else {
      baseCopy[k] = { ...v, originalKey: k }
      if (originalKeyMap[k]) {
        originalKeyErrors.push(`Key collision detected for ${k}`)
      }
      originalKeyMap[k] = true
    }
  }
  if (originalKeyErrors.length) {
    throw Error(`\n${originalKeyErrors.join('\n')}`)
  }
  return baseCopy
}
