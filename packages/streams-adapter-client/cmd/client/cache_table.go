package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"streams-adapter-client/internal/client"
)

const (
	cacheTableKeyWidth  = 55
	cacheTableRateWidth = 10
	cacheTableObsMin    = 28
	cacheTableGapWidth  = 2
	cacheTablePadding   = 2
	cacheTableTickRate  = time.Second
)

var (
	cacheTitleStyle  = lipgloss.NewStyle().Bold(true)
	cacheMetaStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	cacheHeaderStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("86"))
	emptyStyle       = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	selectedRowStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("229"))
)

type cacheTickMsg time.Time

type cacheTableModel struct {
	cache               *client.Cache
	activeSubscriptions func() int
	width               int
	height              int
	now                 time.Time
	offset              int
	quitting            bool
}

func runCacheTable(cache *client.Cache, activeSubscriptions func() int) error {
	program := tea.NewProgram(
		cacheTableModel{
			cache:               cache,
			activeSubscriptions: activeSubscriptions,
			width:               160,
			now:                 time.Now(),
		},
		tea.WithAltScreen(),
	)
	_, err := program.Run()
	return err
}

func tickCacheTable() tea.Cmd {
	return tea.Tick(cacheTableTickRate, func(t time.Time) tea.Msg {
		return cacheTickMsg(t)
	})
}

func (m cacheTableModel) Init() tea.Cmd {
	return tickCacheTable()
}

func (m cacheTableModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil
	case cacheTickMsg:
		m.now = time.Time(msg)
		return m, tickCacheTable()
	case tea.KeyMsg:
		switch msg.String() {
		case "enter", "q", "esc", "ctrl+c":
			m.quitting = true
			return m, tea.Quit
		case "down", "j":
			m.offset++
			return m, nil
		case "up", "k":
			if m.offset > 0 {
				m.offset--
			}
			return m, nil
		case "pgdown", "f":
			m.offset += m.visibleRowCount()
			return m, nil
		case "pgup", "b":
			m.offset -= m.visibleRowCount()
			if m.offset < 0 {
				m.offset = 0
			}
			return m, nil
		case "home", "g":
			m.offset = 0
			return m, nil
		}
	}
	return m, nil
}

func (m cacheTableModel) View() string {
	if m.quitting {
		return ""
	}

	entries := m.cache.All()
	keys := make([]string, 0, len(entries))
	for key := range entries {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	obsWidth := m.observationWidth()

	var lines []string
	lines = append(lines,
		cacheTitleStyle.Render("Streams Cache"),
		cacheMetaStyle.Render(fmt.Sprintf(
			"Updated %s | Active subscriptions: %d | Visible assets: %d | Scroll: j/k, PgUp/PgDn | Close: Enter/q/Esc",
			m.now.Format("15:04:05"),
			m.activeSubscriptions(),
			len(keys),
		)),
		"",
	)

	header := fmt.Sprintf(
		"%s%s%s%s%s",
		padRight("PAYLOAD HASH", cacheTableKeyWidth),
		strings.Repeat(" ", cacheTableGapWidth),
		padRight("OBSERVATION", obsWidth),
		strings.Repeat(" ", cacheTableGapWidth),
		padLeft("RATE/s", cacheTableRateWidth),
	)
	divider := fmt.Sprintf(
		"%s%s%s%s%s",
		strings.Repeat("-", cacheTableKeyWidth),
		strings.Repeat(" ", cacheTableGapWidth),
		strings.Repeat("-", obsWidth),
		strings.Repeat(" ", cacheTableGapWidth),
		strings.Repeat("-", cacheTableRateWidth),
	)
	lines = append(lines, cacheHeaderStyle.Render(header), cacheMetaStyle.Render(divider))

	if len(keys) == 0 {
		lines = append(lines, emptyStyle.Render("No observations yet."))
		return lipgloss.NewStyle().Padding(1, cacheTablePadding).Render(strings.Join(lines, "\n"))
	}

	visibleRows := m.visibleRowCount()
	maxOffset := len(keys) - visibleRows
	if maxOffset < 0 {
		maxOffset = 0
	}
	if m.offset > maxOffset {
		m.offset = maxOffset
	}
	start := m.offset
	end := start + visibleRows
	if end > len(keys) {
		end = len(keys)
	}

	for _, key := range keys[start:end] {
		entry := entries[key]
		observation := summarizeObservation(entry.ObservationJSON)
		line := fmt.Sprintf(
			"%s%s%s%s%s",
			padRight(truncate(key, cacheTableKeyWidth), cacheTableKeyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padRight(truncate(observation, obsWidth), obsWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft(fmt.Sprintf("%.4f", m.cache.Rate(key)), cacheTableRateWidth),
		)
		lines = append(lines, selectedRowStyle.Render(line))
	}

	if len(keys) > visibleRows {
		lines = append(lines, "")
		lines = append(lines, cacheMetaStyle.Render(fmt.Sprintf(
			"Showing %d-%d of %d",
			start+1,
			end,
			len(keys),
		)))
	}

	return lipgloss.NewStyle().Padding(1, cacheTablePadding).Render(strings.Join(lines, "\n"))
}

func (m cacheTableModel) observationWidth() int {
	width := m.width
	if width <= 0 {
		width = 160
	}
	obsWidth := width - (cacheTablePadding * 2) - cacheTableKeyWidth - cacheTableRateWidth - (cacheTableGapWidth * 2)
	if obsWidth < cacheTableObsMin {
		return cacheTableObsMin
	}
	return obsWidth
}

func (m cacheTableModel) visibleRowCount() int {
	height := m.height
	if height <= 0 {
		return 20
	}
	rows := height - 8
	if rows < 5 {
		return 5
	}
	return rows
}

func summarizeObservation(raw []byte) string {
	observation := strings.TrimSpace(string(raw))
	if observation == "" {
		return "-"
	}

	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return observation
	}

	data, _ := payload["data"].(map[string]any)
	if len(data) == 0 {
		return observation
	}

	parts := make([]string, 0, 4)
	for _, key := range []string{"bid", "mid", "ask", "result"} {
		if value, ok := data[key]; ok {
			parts = append(parts, fmt.Sprintf("%s=%v", key, value))
		}
	}
	if indicatedTime, ok := extractTimestamp(data); ok {
		parts = append(parts, fmt.Sprintf("ts=%s", indicatedTime))
	}
	if len(parts) == 0 {
		return observation
	}
	return strings.Join(parts, "  ")
}

func extractTimestamp(data map[string]any) (string, bool) {
	timestamps, ok := data["timestamps"].(map[string]any)
	if !ok {
		return "", false
	}
	for _, key := range []string{"providerIndicatedTimeUnixMs", "providerDataReceivedUnixMs", "providerDataStreamEstablishedUnixMs"} {
		if value, ok := timestamps[key]; ok {
			return fmt.Sprintf("%v", value), true
		}
	}
	return "", false
}

func padRight(value string, width int) string {
	if width <= len(value) {
		return value
	}
	return value + strings.Repeat(" ", width-len(value))
}

func padLeft(value string, width int) string {
	if width <= len(value) {
		return value
	}
	return strings.Repeat(" ", width-len(value)) + value
}
