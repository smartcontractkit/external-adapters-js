package main

import "sync"

type subscriptionBook struct {
	mu       sync.RWMutex
	payloads map[string]struct{}
}

func newSubscriptionBook() *subscriptionBook {
	return &subscriptionBook{payloads: make(map[string]struct{})}
}

func (b *subscriptionBook) Add(payload string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.payloads[payload] = struct{}{}
}

func (b *subscriptionBook) Count() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.payloads)
}
