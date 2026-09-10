package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"

	"streams-adapter-client/internal/client"
)

// parseServerAddr parses SERVER_ADDR (or the default) and returns the
// dial target (host:port) and whether TLS should be used.
// Accepts plain "host:port" or a URL like "https://host/path:port".
func parseServerAddr() (addr string, useTLS bool) {
	raw := os.Getenv("SERVER_ADDR")
	if raw == "" {
		return "localhost:5050", false
	}
	// If no scheme, treat as plain host:port.
	if !strings.Contains(raw, "://") {
		return raw, false
	}
	u, err := url.Parse(raw)
	if err != nil {
		log.Fatalf("invalid SERVER_ADDR %q: %v", raw, err)
	}
	useTLS = u.Scheme == "https" || u.Scheme == "grpcs"
	// url.Parse puts host:port in u.Host when the URL has a standard port.
	// When the port is embedded in the path (e.g. .../path:5050) we need to
	// extract it manually.
	host := u.Host
	if host == "" {
		host = u.Hostname()
	}
	// If the path contains a port suffix (":NNNN" at the end), move it to host.
	path := strings.TrimPrefix(u.Path, "/")
	if idx := strings.LastIndex(path, ":"); idx != -1 {
		port := path[idx+1:]
		host = host + ":" + port
	}
	if host == "" {
		log.Fatalf("could not determine host from SERVER_ADDR %q", raw)
	}
	return host, useTLS
}

// parsePayload extracts the JSON payload from CLI args.
// Accepts either bare JSON or the "payload=<json>" form with optional surrounding quotes.
func parsePayload(args []string) (string, error) {
	raw := strings.Join(args, " ")
	raw = strings.TrimPrefix(raw, "payload=")
	raw = strings.Trim(raw, "'\"")
	if raw == "" {
		return "", fmt.Errorf("empty payload")
	}
	return raw, nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-3] + "..."
}

// loadSubscriptionsFile reads a JSON file containing an array of payload strings
// or objects and returns them as a slice of JSON strings ready to pass to Subscribe.
// Supported formats:
//
//	["<raw json payload>", ...]              — array of strings
//	[{"data":{...}}, ...]                   — array of objects (each marshalled back)
func loadSubscriptionsFile(path string) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read file: %w", err)
	}
	var raw []json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse subscriptions file: %w", err)
	}
	payloads := make([]string, 0, len(raw))
	for _, r := range raw {
		// If the element is a JSON string, unwrap it; otherwise use as-is.
		var s string
		if err := json.Unmarshal(r, &s); err == nil {
			payloads = append(payloads, s)
		} else {
			payloads = append(payloads, string(r))
		}
	}
	return payloads, nil
}

func main() {
	subsFile := flag.String("subscriptions", "", "path to a JSON file containing an array of payloads to subscribe on start")
	flag.Parse()

	addr, useTLS := parseServerAddr()

	var creds grpc.DialOption
	if useTLS {
		creds = grpc.WithTransportCredentials(credentials.NewClientTLSFromCert(nil, ""))
	} else {
		creds = grpc.WithTransportCredentials(insecure.NewCredentials())
	}
	opts := []grpc.DialOption{creds}

	ctx := context.Background()
	cache := client.NewCache()
	subscriptions := newSubscriptionBook()
	initialLogs := []string{
		fmt.Sprintf("connected to streams-adapter at %s", addr),
		"type help or ? for available commands",
	}

	refreshSeconds := 60
	if raw := os.Getenv("CACHE_CLEANUP_INTERVAL"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			refreshSeconds = parsed
		}
	}
	c, err := client.NewClient(ctx, addr, cache, time.Duration(refreshSeconds)*time.Second, opts...)
	if err != nil {
		log.Fatalf("failed to connect to %s: %v", addr, err)
	}
	defer c.Close()

	if *subsFile != "" {
		payloads, err := loadSubscriptionsFile(*subsFile)
		if err != nil {
			log.Fatalf("failed to load subscriptions file: %v", err)
		}
		for _, p := range payloads {
			if err := c.Subscribe(p); err != nil {
				initialLogs = append(initialLogs, fmt.Sprintf("auto-subscribe failed: %v", err))
			} else {
				subscriptions.Add(p)
				initialLogs = append(initialLogs, fmt.Sprintf("auto-subscribed: %s", p))
			}
		}
	}

	if err := runClientApp(addr, c, cache, subscriptions, initialLogs); err != nil {
		log.Fatalf("client ui error: %v", err)
	}
}
