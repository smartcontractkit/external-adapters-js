package main

// Tool to parse adapter README.md files under packages/sources/*
// and generate a JSON configuration describing endpoint and parameter
// aliases in a compact, machine‑friendly format:
//
// {
//   "adapters": {
//     "<adapterName>": {
//       "endpoints": {
//         "<canonicalEndpointName>": {
//           "aliases": [ "<endpointAlias1>", "<endpointAlias2>", "..." ],
//           "params": {
//             "<canonicalParamName>": {
//               "aliases": [ "<paramAlias1>", "<paramAlias2>", "..." ],
//               "required": true
//             }
//           }
//         }
//       }
//     }
//   }
// }
//
// Usage (must be run from packages/streams-adapter):
//   go run ./cmd/readme-parser

import (
	"bufio"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/goccy/go-json"
)

// ─────────────────────────────────────────────────────────────────────────────
// Data structures mirroring the output JSON schema
// ─────────────────────────────────────────────────────────────────────────────

// ParamSpec describes a single input parameter for an endpoint.
type ParamSpec struct {
	Aliases  []string `json:"aliases,omitempty"` // Alternative names accepted for this param
	Required bool     `json:"required"`          // Whether the param is mandatory
}

// EndpointConfig holds metadata for one endpoint within an adapter.
type EndpointConfig struct {
	Aliases []string             `json:"aliases,omitempty"` // Supported names for this endpoint
	Params  map[string]ParamSpec `json:"params,omitempty"`  // Canonical param name → spec
}

// AdapterConfig aggregates all endpoints exposed by an adapter.
type AdapterConfig struct {
	Endpoints map[string]EndpointConfig `json:"endpoints,omitempty"`
}

// AllAdaptersConfig is the root object written to endpoint_aliases.json.
type AllAdaptersConfig struct {
	Adapters map[string]AdapterConfig `json:"adapters"`
}

// ─────────────────────────────────────────────────────────────────────────────
// Regex and marker strings used to identify README structure
// ─────────────────────────────────────────────────────────────────────────────

var (
	// backtickRe captures text inside Markdown inline code, e.g. `crypto` → "crypto"
	backtickRe = regexp.MustCompile("`([^`]+)`")

	// headerPrefix detects level-2 Markdown headings ("## ...")
	headerPrefix = "## "
	// headerEP is the suffix used by endpoint section titles ("## Crypto Endpoint")
	headerEP = " Endpoint"
	// headerParams marks the start of the input parameters table
	headerParams = "### Input Params"
)

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

func main() {
	// Step 1: Discover all README.md files
	// We expect to be run from packages/streams-adapter, so the relative path
	// "../sources/*/README.md" reaches every adapter's documentation.
	paths, err := filepath.Glob("../sources/*/README.md")
	if err != nil {
		log.Fatalf("glob error: %v", err)
	}
	if len(paths) == 0 {
		log.Fatal("no README.md files found under packages/sources/*/")
	}

	all := AllAdaptersConfig{
		Adapters: map[string]AdapterConfig{},
	}

	// Step 2: Parse each README and collect endpoint/param info
	for _, p := range paths {
		// Derive adapter name from directory (e.g. "../sources/ncfx/README.md" → "ncfx")
		adapterName := filepath.Base(filepath.Dir(p))

		f, err := os.Open(p)
		if err != nil {
			log.Fatalf("failed to open %s: %v", p, err)
		}

		adapterCfg, err := parseReadme(f)
		_ = f.Close()
		if err != nil {
			log.Fatalf("failed to parse %s: %v", p, err)
		}

		all.Adapters[adapterName] = adapterCfg
	}

	// Step 3: Write aggregated config to JSON
	outPath := "endpoint_aliases.json"
	outFile, err := os.Create(outPath)
	if err != nil {
		log.Fatalf("failed to create %s: %v", outPath, err)
	}
	defer outFile.Close()

	enc := json.NewEncoder(outFile)
	enc.SetIndent("", "  ")
	if err := enc.Encode(all); err != nil {
		log.Fatalf("json encode error: %v", err)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// README parsing – single-pass state machine
// ─────────────────────────────────────────────────────────────────────────────
//
// README structure we care about (example):
//
//   ## Crypto Endpoint                          ← modeEndpoint = true, currentEndpointKey = "crypto"
//   Supported names for this endpoint are: `crypto`, `price`.
//                                               ← extract endpoint aliases from backticks
//   ### Input Params                            ← tableCtx = tableEndpointInput
//   | Required? | Name   | Aliases | ...        ← header row (skip)
//   | --------- | ------ | ------- | ---        ← alignment row (skip)
//   | ✅        | base   | `coin`  | ...        ← data row → parse param name + aliases
//
//   ## Some Other Section                       ← modeEndpoint = false (end of endpoint)
//
// Parsing states:
//   • modeEndpoint – are we inside an "## <Name> Endpoint" section?
//   • tableCtx     – what kind of Markdown table are we currently reading?
//
// ─────────────────────────────────────────────────────────────────────────────

func parseReadme(r io.Reader) (AdapterConfig, error) {
	sc := bufio.NewScanner(r)

	cfg := AdapterConfig{
		Endpoints: map[string]EndpointConfig{},
	}

	// Table context enum
	// Identifies the type of Markdown table we're currently parsing.
	type tableContext int
	const (
		tableNone          tableContext = iota // Not inside any table
		tableEndpointInput                     // Inside "### Input Params" table
	)

	// State variables
	var (
		// currentEndpointKey holds the canonical (lowercase) name of the endpoint
		// we're currently inside, e.g. "crypto". Empty if outside any endpoint.
		currentEndpointKey string

		// modeEndpoint is true when the scanner is between an "## <X> Endpoint"
		// heading and the next "##" heading (i.e. inside an endpoint section).
		modeEndpoint bool

		// tableCtx tells us which type of table we're parsing (or tableNone).
		tableCtx tableContext
		// tableHeaderSeen / tableAlignSeen track whether we've passed the
		// Markdown table header and alignment rows (the first two rows).
		tableHeaderSeen bool
		tableAlignSeen  bool
	)

	// resetTable clears table-related state when exiting or switching tables.
	resetTable := func() {
		tableCtx = tableNone
		tableHeaderSeen = false
		tableAlignSeen = false
	}

	// Line-by-line scan
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())

		// Detect "### Input Params" heading
		// This signals the start of the parameter table for the current endpoint.
		if strings.HasPrefix(line, headerParams) {
			resetTable()
			if modeEndpoint && currentEndpointKey != "" {
				tableCtx = tableEndpointInput
			} else {
				tableCtx = tableNone
			}
			continue
		}

		// Handle "##" section headers
		if strings.HasPrefix(line, headerPrefix) {
			resetTable()

			// Check if this is an endpoint section (e.g. "## Crypto Endpoint")
			if strings.HasSuffix(line, headerEP) {
				modeEndpoint = true

				// Extract endpoint name: "## Crypto Endpoint" → "crypto"
				namePart := strings.TrimSpace(strings.TrimPrefix(line, headerPrefix))
				namePart = strings.TrimSuffix(namePart, headerEP)
				currentEndpointKey = strings.ToLower(namePart)

				// Initialize endpoint entry if first time seeing it
				if _, ok := cfg.Endpoints[currentEndpointKey]; !ok {
					cfg.Endpoints[currentEndpointKey] = EndpointConfig{
						Aliases: []string{},
						Params:  map[string]ParamSpec{},
					}
				}
				continue
			}

			// Any other "##" heading ends the current endpoint section
			modeEndpoint = false
			currentEndpointKey = ""
			continue
		}

		// Inside endpoint section: capture supported names
		// Lines like: "Supported names for this endpoint are: `crypto`, `price`."
		if modeEndpoint && currentEndpointKey != "" {
			if strings.Contains(line, "Supported names for this endpoint are:") ||
				strings.Contains(line, "is the only supported name for this endpoint") {
				names := extractBacktickWords(line)
				if len(names) > 0 {
					ep := cfg.Endpoints[currentEndpointKey]
					for _, n := range names {
						n = strings.TrimSpace(n)
						if n == "" {
							continue
						}
						nLower := strings.ToLower(n)
						// Avoid duplicates
						if !contains(ep.Aliases, nLower) {
							ep.Aliases = append(ep.Aliases, nLower)
						}
					}
					cfg.Endpoints[currentEndpointKey] = ep
				}
				continue
			}
		}

		// Table parsing
		// Process rows of the Markdown table we're inside (if any).
		if tableCtx != tableNone {
			row := strings.TrimSpace(line)

			// Skip blank lines between "### Input Params" and the actual table
			if row == "" {
				continue
			}

			// Non-pipe line means end of table
			if !strings.HasPrefix(row, "|") {
				resetTable()
				continue
			}

			// Skip header row (first row starting with "|")
			if !tableHeaderSeen {
				tableHeaderSeen = true
				continue
			}
			// Skip alignment row (second row, e.g. "| --- | --- |")
			if !tableAlignSeen {
				tableAlignSeen = true
				continue
			}

			// Parse data rows (third row onwards)
			cols := parseTableRow(row)
			if len(cols) == 0 {
				continue
			}

			parseEndpointInputRow(&cfg, currentEndpointKey, cols)
		}
	}

	return cfg, sc.Err()
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

// parseTableRow splits a Markdown table row into cell values.
func parseTableRow(line string) []string {
	line = strings.TrimSpace(line)
	line = strings.TrimPrefix(line, "|")
	line = strings.TrimSuffix(line, "|")
	parts := strings.Split(line, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		out = append(out, p)
	}
	return out
}

// parseEndpointInputRow processes a single data row from an "### Input Params" table.
//
// Expected column layout (based on adapter README conventions):
//
//	cols[0] = Required? (contains "✅" if required)
//	cols[1] = Name      (canonical parameter name)
//	cols[2] = Aliases   (Markdown backtick-quoted aliases, e.g. "`coin`, `symbol`")
//
// The function extracts the parameter name and its aliases, storing them
// in lowercase form under the given endpoint key.
func parseEndpointInputRow(cfg *AdapterConfig, epKey string, cols []string) {
	if len(cols) < 3 {
		return
	}
	requiredCol := cols[0]
	nameCol := cols[1]
	aliasesCol := cols[2]

	name := strings.TrimSpace(nameCol)
	if name == "" {
		return
	}
	nameLower := strings.ToLower(name)

	ep := cfg.Endpoints[epKey]
	if ep.Params == nil {
		ep.Params = map[string]ParamSpec{}
	}

	ps := ep.Params[nameLower]
	ps.Required = strings.Contains(requiredCol, "✅")

	// Extract aliases from backtick-quoted words in the aliases column
	aliases := extractBacktickWords(aliasesCol)
	for _, a := range aliases {
		a = strings.TrimSpace(a)
		if a == "" {
			continue
		}
		aLower := strings.ToLower(a)
		// Avoid duplicates
		if !contains(ps.Aliases, aLower) {
			ps.Aliases = append(ps.Aliases, aLower)
		}
	}
	ep.Params[nameLower] = ps
	cfg.Endpoints[epKey] = ep
}

// extractBacktickWords returns all strings enclosed in backticks within s.
// Example: "Use `foo` or `bar`" → ["foo", "bar"]
func extractBacktickWords(s string) []string {
	matches := backtickRe.FindAllStringSubmatch(s, -1)
	var out []string
	for _, m := range matches {
		if len(m) > 1 {
			out = append(out, m[1])
		}
	}
	return out
}

// contains returns true if slice includes the value v.
func contains(slice []string, v string) bool {
	for _, x := range slice {
		if x == v {
			return true
		}
	}
	return false
}
