import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import fs from 'fs'
import path from 'path'
import { getWorkspaceAdapters } from '../workspace'

const OUTPUT_PATH = 'packages/streams-adapter/endpoint_aliases.json'
const INCLUDES_OUTPUT_PATH = 'packages/streams-adapter/adapter_includes.json'

/**
 * Adapter types that are served by the streams adapter
 */
const INCLUDED_TYPES = ['sources', 'composites']

/**
 * Adapter keys that have no workspace package of their own, but are reachable at runtime via
 * `adapterNameOverride`. Each entry copies the source key's config to the alias key.
 */
const ADAPTER_KEY_ALIASES: Record<string, string> = {
  cfbenchmarks: 'cfbenchmarks2',
}

interface EndpointConfig {
  aliases?: string[]
}

interface AllAdaptersConfig {
  adapters: Record<
    string,
    {
      defaultEndpoint?: string
      endpoints?: Record<string, EndpointConfig>
      includes?: Record<string, Record<string, { inverse: boolean }>>
    }
  >
}

interface AdapterIncludesConfig {
  adapters: Record<string, Record<string, Record<string, { inverse: boolean }>>>
}

interface LoadResult {
  adapter: Adapter | null
  skipReason?: string
}

async function loadAdapter(adapterPath: string): Promise<LoadResult> {
  const distPath = path.join(process.cwd(), adapterPath, 'dist', 'index.js')
  if (!fs.existsSync(distPath)) {
    return { adapter: null, skipReason: 'dist/index.js not found' }
  }
  try {
    const mod = await import(distPath)
    const adapter = mod?.adapter
    if (!adapter?.endpoints) {
      return { adapter: null, skipReason: 'no adapter.endpoints exported' }
    }
    return { adapter: adapter as Adapter }
  } catch (err) {
    return { adapter: null, skipReason: err instanceof Error ? err.message : String(err) }
  }
}

function extractIncludes(
  adapter: Adapter,
): Record<string, Record<string, { inverse: boolean }>> | undefined {
  const priceAdapter = adapter as Adapter & {
    includesMap?: Record<string, Record<string, { inverse: boolean }>>
  }
  if (!priceAdapter.includesMap) {
    return undefined
  }

  const includes: Record<string, Record<string, { inverse: boolean }>> = {}
  for (const [from, toMap] of Object.entries(priceAdapter.includesMap)) {
    if (!toMap || Object.keys(toMap).length === 0) {
      continue
    }
    includes[from] = {}
    for (const [to, details] of Object.entries(toMap)) {
      if (!details) {
        continue
      }
      includes[from][to] = { inverse: !!details.inverse }
    }
  }

  return Object.keys(includes).length > 0 ? includes : undefined
}

function extractEndpoints(adapter: Adapter): Record<string, EndpointConfig> | undefined {
  const endpoints: Record<string, EndpointConfig> = {}

  for (const ep of adapter.endpoints || []) {
    const canonicalName = ep.name.toLowerCase()
    const allAliases = [canonicalName]

    if (Array.isArray(ep.aliases)) {
      for (const alias of ep.aliases) {
        const lower = alias.toLowerCase()
        if (!allAliases.includes(lower)) allAliases.push(lower)
      }
    }

    endpoints[canonicalName] = {
      aliases: allAliases.length > 0 ? allAliases : undefined,
    }
  }

  return Object.keys(endpoints).length > 0 ? endpoints : undefined
}

async function main(): Promise<void> {
  const allAdapters = getWorkspaceAdapters()
  const included = allAdapters.filter((a) => INCLUDED_TYPES.includes(a.type))
  const v3Sources = included.filter((a) => a.framework === '3')
  const v2Sources = included.filter((a) => a.framework !== '3')

  if (v3Sources.length === 0) {
    console.error('No EAv3 source adapters found')
    process.exit(1)
  }

  const result: AllAdaptersConfig = { adapters: {} }
  const skipped: { name: string; reason: string }[] = []

  for (const meta of v3Sources) {
    const { adapter, skipReason } = await loadAdapter(meta.location)
    if (adapter) {
      const adapterKey = meta.descopedName.replace(/-adapter$/, '')
      result.adapters[adapterKey] = {
        defaultEndpoint: adapter.defaultEndpoint ?? undefined,
        endpoints: extractEndpoints(adapter),
        includes: extractIncludes(adapter),
      }
    } else {
      skipped.push({ name: meta.descopedName, reason: skipReason || 'unknown' })
    }
  }

  for (const [sourceKey, aliasKey] of Object.entries(ADAPTER_KEY_ALIASES)) {
    const source = result.adapters[sourceKey]
    if (source) {
      result.adapters[aliasKey] = JSON.parse(JSON.stringify(source))
      console.log(`Copied ${sourceKey} config to ${aliasKey}`)
    } else {
      console.log(`Could not copy ${sourceKey} config to ${aliasKey}: ${sourceKey} not generated`)
    }
  }

  const outPath = path.resolve(process.cwd(), OUTPUT_PATH)
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Written ${Object.keys(result.adapters).length} EAv3 adapters to ${OUTPUT_PATH}`)

  const includesResult: AdapterIncludesConfig = { adapters: {} }
  for (const [adapterKey, adapterCfg] of Object.entries(result.adapters)) {
    if (adapterCfg.includes) {
      includesResult.adapters[adapterKey] = adapterCfg.includes
    }
  }

  const includesOutPath = path.resolve(process.cwd(), INCLUDES_OUTPUT_PATH)
  fs.writeFileSync(includesOutPath, JSON.stringify(includesResult, null, 2), 'utf-8')
  console.log(
    `Written ${
      Object.keys(includesResult.adapters).length
    } EAv3 adapters with includes to ${includesOutPath}`,
  )

  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length} EAv3 adapters:`)
    for (const { name, reason } of skipped) {
      console.log(`  - ${name}: ${reason}`)
    }
  }

  if (v2Sources.length > 0) {
    console.log(`\nExcluded ${v2Sources.length} EAv2 adapters (not supported):`)
    for (const a of v2Sources) {
      console.log(`  - ${a.descopedName}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
