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
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/goccy/go-json"
)

type ParamSpec struct {
	Aliases  []string `json:"aliases,omitempty"`
	Required bool     `json:"required"`
}

type EndpointConfig struct {
	Aliases []string             `json:"aliases,omitempty"`
	Params  map[string]ParamSpec `json:"params,omitempty"`
}

type AdapterConfig struct {
	Endpoints map[string]EndpointConfig `json:"endpoints,omitempty"`
}

type AllAdaptersConfig struct {
	Adapters map[string]AdapterConfig `json:"adapters"`
}

var (
	backtickRe   = regexp.MustCompile("`([^`]+)`")
	headerPrefix = "## "
	headerEP     = " Endpoint"
)

func main() {
	// Discover all README.md files under packages/sources/*/
	// This assumes the working directory is packages/streams-adapter.
	paths, err := filepath.Glob("../sources/*/README.md")
	if err != nil {
		fmt.Fprintf(os.Stderr, "glob error: %v\n", err)
		os.Exit(1)
	}
	if len(paths) == 0 {
		fmt.Fprintln(os.Stderr, "no README.md files found under packages/sources/*/")
		os.Exit(1)
	}

	all := AllAdaptersConfig{
		Adapters: map[string]AdapterConfig{},
	}

	for _, p := range paths {
		adapterName := filepath.Base(filepath.Dir(p))

		f, err := os.Open(p)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to open %s: %v\n", p, err)
			os.Exit(1)
		}

		adapterCfg, err := parseReadme(f)
		_ = f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to parse %s: %v\n", p, err)
			os.Exit(1)
		}

		all.Adapters[adapterName] = adapterCfg
	}

	outPath := "endpoint_aliases.json"
	outFile, err := os.Create(outPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create %s: %v\n", outPath, err)
		os.Exit(1)
	}
	defer outFile.Close()

	enc := json.NewEncoder(outFile)
	enc.SetIndent("", "  ")
	if err := enc.Encode(all); err != nil {
		fmt.Fprintf(os.Stderr, "json encode error: %v\n", err)
		os.Exit(1)
	}
}

func parseReadme(r io.Reader) (AdapterConfig, error) {
	sc := bufio.NewScanner(r)

	cfg := AdapterConfig{
		Endpoints: map[string]EndpointConfig{},
	}

	type tableContext int
	const (
		tableNone tableContext = iota
		tableEndpointInput
	)
	var (
		currentEndpointKey string

		modeEndpoint bool

		tableCtx        tableContext
		tableHeaderSeen bool
		tableAlignSeen  bool
	)

	resetTable := func() {
		tableCtx = tableNone
		tableHeaderSeen = false
		tableAlignSeen = false
	}

	for sc.Scan() {
		line := sc.Text()
		trimmed := strings.TrimSpace(line)

		// Detect "### Input Params" to start a table
		if strings.HasPrefix(trimmed, "### Input Params") {
			resetTable()
			if modeEndpoint && currentEndpointKey != "" {
				tableCtx = tableEndpointInput
			} else {
				tableCtx = tableNone
			}
			continue
		}

		// Section headers
		if strings.HasPrefix(line, headerPrefix) {
			resetTable()

			// Endpoint sections: "## Crypto Endpoint"
			if strings.HasSuffix(line, headerEP) {
				modeEndpoint = true

				namePart := strings.TrimSpace(strings.TrimPrefix(line, headerPrefix))
				namePart = strings.TrimSuffix(namePart, headerEP)
				currentEndpointKey = strings.ToLower(namePart)

				if _, ok := cfg.Endpoints[currentEndpointKey]; !ok {
					cfg.Endpoints[currentEndpointKey] = EndpointConfig{
						Aliases: []string{},
						Params:  map[string]ParamSpec{},
					}
				}
				continue
			}

			// Some other "##" heading – end any endpoint mode
			modeEndpoint = false
			currentEndpointKey = ""
			continue
		}

		// Inside an endpoint section: capture supported names
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
		if tableCtx != tableNone {
			row := strings.TrimSpace(line)
			// Skip blank lines between "### Input Params" and the actual table
			if row == "" {
				continue
			}
			if !strings.HasPrefix(row, "|") {
				// End of table
				resetTable()
				continue
			}

			// Header row
			if !tableHeaderSeen {
				tableHeaderSeen = true
				continue
			}
			// Alignment row
			if !tableAlignSeen {
				tableAlignSeen = true
				continue
			}

			// Data row
			cols := parseTableRow(row)
			if len(cols) == 0 {
				continue
			}

			switch tableCtx {
			case tableEndpointInput:
				parseEndpointInputRow(&cfg, currentEndpointKey, cols)
			}
		}
	}

	return cfg, sc.Err()
}

func parseTableRow(line string) []string {
	// Remove leading/trailing '|'
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

// Endpoint Input Params table rows: Required?, Name, Aliases, ...
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

	aliases := extractBacktickWords(aliasesCol)
	for _, a := range aliases {
		a = strings.TrimSpace(a)
		if a == "" {
			continue
		}
		aLower := strings.ToLower(a)
		if !contains(ps.Aliases, aLower) {
			ps.Aliases = append(ps.Aliases, aLower)
		}
	}
	ep.Params[nameLower] = ps
	cfg.Endpoints[epKey] = ep
}

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

func contains(slice []string, v string) bool {
	for _, x := range slice {
		if x == v {
			return true
		}
	}
	return false
}
