package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"time"

	"golang.org/x/term"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"streams-adapter-client/internal/client"
)

func serverAddr() string {
	if v := os.Getenv("SERVER_ADDR"); v != "" {
		return v
	}
	return "localhost:5050"
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

const (
	colKey  = 55
	colRate = 10
	// 2-space left margin + two 2-space gaps between columns
	colOverhead = 2 + 2 + 2
	colObsMin   = 20
)

// termWidth returns the current terminal width, falling back to 160.
func termWidth() int {
	w, _, err := term.GetSize(int(os.Stdout.Fd()))
	if err != nil || w <= 0 {
		return 160
	}
	return w
}

// obsWidth computes the observation column width to fill the full terminal.
func obsWidth() int {
	w := termWidth() - colOverhead - colKey - colRate
	if w < colObsMin {
		return colObsMin
	}
	return w
}

// runCacheLiveLoop clears the screen and redraws the cache table every second
// until stop is closed.
func runCacheLiveLoop(c *client.Cache, stop <-chan struct{}) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	draw := func() {
		entries := c.All()
		keys := make([]string, 0, len(entries))
		for k := range entries {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		// Clear screen, move cursor to top-left.
		colObs := obsWidth()
		fmt.Print("\033[H\033[2J")
		fmt.Printf("  Cache — %s   (press Enter to stop)\n\n",
			time.Now().Format("15:04:05.000"))
		fmt.Printf("  %-*s  %-*s  %*s\n",
			colKey, "CACHE KEY",
			colObs, "OBSERVATION",
			colRate, "RATE/s")
		fmt.Printf("  %s  %s  %s\n",
			strings.Repeat("─", colKey),
			strings.Repeat("─", colObs),
			strings.Repeat("─", colRate))

		if len(keys) == 0 {
			fmt.Println("  (empty)")
			return
		}
		for _, k := range keys {
			e := entries[k]
			obs := strings.TrimSpace(string(e.ObservationJSON))
			r := c.Rate(k)
			fmt.Printf("  %-*s  %-*s  %*.4f\n",
				colKey, truncate(k, colKey),
				colObs, truncate(obs, colObs),
				colRate, r)
		}
	}

	draw()
	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			draw()
		}
	}
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

	addr := serverAddr()

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}

	ctx := context.Background()
	cache := client.NewCache()

	c, err := client.NewClient(ctx, addr, cache, opts...)
	if err != nil {
		log.Fatalf("failed to connect to %s: %v", addr, err)
	}
	defer c.Close()

	fmt.Printf("Connected to streams-adapter at %s\n", addr)

	if *subsFile != "" {
		payloads, err := loadSubscriptionsFile(*subsFile)
		if err != nil {
			log.Fatalf("failed to load subscriptions file: %v", err)
		}
		for _, p := range payloads {
			if err := c.Subscribe(p); err != nil {
				log.Printf("auto-subscribe error (payload=%s): %v", p, err)
			} else {
				fmt.Printf("auto-subscribed: %s\n", p)
			}
		}
	}

	fmt.Println("Commands: subscribe <payload> | unsubscribe <payload> | cache | rate | quit")
	fmt.Println(`Example:  subscribe payload='{"data":{"endpoint":"cryptolwba","from":"LINK","to":"USD"}}'`)

	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		parts := strings.Fields(line)
		if len(parts) == 0 {
			continue
		}

		switch parts[0] {
		case "subscribe":
			if len(parts) < 2 {
				fmt.Println(`usage: subscribe payload='{"data":{...}}'`)
				continue
			}
			payload, err := parsePayload(parts[1:])
			if err != nil {
				fmt.Printf("invalid payload: %v\n", err)
				continue
			}
			if err := c.Subscribe(payload); err != nil {
				log.Printf("subscribe error: %v", err)
			} else {
				fmt.Printf("subscribed with payload %s\n", payload)
			}

		case "unsubscribe":
			if len(parts) < 2 {
				fmt.Println(`usage: unsubscribe payload='{"data":{...}}'`)
				continue
			}
			payload, err := parsePayload(parts[1:])
			if err != nil {
				fmt.Printf("invalid payload: %v\n", err)
				continue
			}
			if err := c.Unsubscribe(payload); err != nil {
				log.Printf("unsubscribe error: %v", err)
			} else {
				fmt.Printf("unsubscribed with payload %s\n", payload)
			}

		case "cache":
			stop := make(chan struct{})
			go runCacheLiveLoop(cache, stop)
			scanner.Scan() // block until Enter
			close(stop)
			fmt.Print("\033[H\033[2J") // clear screen on exit

		case "rate":
			entries := cache.All()
			if len(entries) == 0 {
				fmt.Println("(no subscriptions)")
				continue
			}
			fmt.Printf("  %-40s  %10s  %10s\n", "asset_id", "msgs/sec", "total")
			for id := range entries {
				r := cache.Rate(id)
				e, _ := cache.Get(id)
				fmt.Printf("  %-40s  %10.4f  %10d\n", id, r, e.Count)
			}

		case "quit", "exit":
			fmt.Println("bye")
			return

		default:
			fmt.Printf("unknown command %q. try: subscribe | unsubscribe | cache | rate | quit\n", parts[0])
		}
	}
}
