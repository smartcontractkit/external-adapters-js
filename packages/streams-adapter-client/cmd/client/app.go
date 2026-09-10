package main

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	clientpkg "streams-adapter-client/internal/client"
)

type appView int

const (
	viewCache appView = iota
	viewRates
	viewHelp
	appTickRate     = time.Second
	maxRetainedLogs = 6
	statusBarHeight = 2
	headerHeight    = 3
	inputHeight     = 3
	minTableRows    = 5
)

var (
	statusConnectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).Bold(true)
	statusErrorStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("203")).Bold(true)
	sectionTitleStyle    = lipgloss.NewStyle().Bold(true)
	selectedTabStyle     = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	idleTabStyle         = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	helpStyle            = lipgloss.NewStyle().Foreground(lipgloss.Color("245"))
)

type appTickMsg time.Time

type streamErrMsg struct {
	err error
}

type clientAppModel struct {
	addr          string
	client        *clientpkg.Client
	cache         *clientpkg.Cache
	subscriptions *subscriptionBook
	input         textinput.Model
	view          appView
	width         int
	height        int
	now           time.Time
	offset        int
	logs          []string
	connected     bool
	statusMessage string
	quitting      bool
}

func runClientApp(addr string, c *clientpkg.Client, cache *clientpkg.Cache, subscriptions *subscriptionBook, initialLogs []string) error {
	input := textinput.New()
	input.Placeholder = `help | subscribe payload='{"data":{...}}'`
	input.Prompt = "> "
	input.CharLimit = 8192
	input.Focus()
	input.Width = 120

	program := tea.NewProgram(clientAppModel{
		addr:          addr,
		client:        c,
		cache:         cache,
		subscriptions: subscriptions,
		input:         input,
		view:          viewCache,
		now:           time.Now(),
		connected:     true,
		statusMessage: "connected",
		logs:          append([]string(nil), initialLogs...),
	}, tea.WithAltScreen())
	_, err := program.Run()
	return err
}

func tickApp() tea.Cmd {
	return tea.Tick(appTickRate, func(t time.Time) tea.Msg {
		return appTickMsg(t)
	})
}

func waitForStreamError(errCh <-chan error) tea.Cmd {
	return func() tea.Msg {
		err := <-errCh
		return streamErrMsg{err: err}
	}
}

func (m clientAppModel) Init() tea.Cmd {
	return tea.Batch(tickApp(), waitForStreamError(m.client.Errors()))
}

func (m clientAppModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.input.Width = max(20, msg.Width-6)
		return m, nil
	case appTickMsg:
		m.now = time.Time(msg)
		return m, tickApp()
	case streamErrMsg:
		if msg.err != nil {
			m.connected = false
			m.statusMessage = fmt.Sprintf("stream error: %v", msg.err)
			m.appendLog(m.statusMessage)
		}
		return m, nil
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			m.quitting = true
			return m, tea.Quit
		case "tab":
			m.view = (m.view + 1) % 3
			m.offset = 0
			return m, nil
		case "shift+tab":
			m.view = (m.view + 2) % 3
			m.offset = 0
			return m, nil
		case "pgdown":
			m.offset += m.visibleRows()
			return m, nil
		case "pgup":
			m.offset -= m.visibleRows()
			if m.offset < 0 {
				m.offset = 0
			}
			return m, nil
		case "home":
			m.offset = 0
			return m, nil
		case "end":
			m.offset = 1 << 30
			return m, nil
		case "enter":
			command := strings.TrimSpace(m.input.Value())
			m.input.SetValue("")
			if command == "" {
				return m, nil
			}
			if quit := m.executeCommand(command); quit {
				m.quitting = true
				return m, tea.Quit
			}
			return m, nil
		}
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	cmds = append(cmds, cmd)
	return m, tea.Batch(cmds...)
}

func (m *clientAppModel) executeCommand(command string) bool {
	command = strings.TrimSpace(command)
	command = strings.TrimPrefix(command, "/")
	parts := strings.Fields(command)
	if len(parts) == 0 {
		return false
	}

	switch parts[0] {
	case "subscribe":
		if len(parts) < 2 {
			m.appendLog(`usage: subscribe payload='{"data":{...}}'`)
			return false
		}
		payload, err := parsePayload(parts[1:])
		if err != nil {
			m.appendLog(fmt.Sprintf("invalid payload: %v", err))
			return false
		}
		if err := m.client.Subscribe(payload); err != nil {
			m.appendLog(fmt.Sprintf("subscribe error: %v", err))
			return false
		}
		m.subscriptions.Add(payload)
		m.statusMessage = "subscription sent"
		m.appendLog(fmt.Sprintf("subscribed: %s", payload))
		m.view = viewCache
	case "cache":
		m.view = viewCache
		m.offset = 0
	case "rate", "rates":
		m.view = viewRates
		m.offset = 0
	case "help", "h", "?":
		m.view = viewHelp
		m.offset = 0
		m.statusMessage = "help"
		m.appendLog("opened help")
	case "quit", "exit", "q":
		return true
	default:
		m.appendLog(fmt.Sprintf("unknown command %q", parts[0]))
	}

	return false
}

func (m *clientAppModel) appendLog(line string) {
	timestamped := fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05"), line)
	m.logs = append(m.logs, timestamped)
	if len(m.logs) > maxRetainedLogs {
		m.logs = m.logs[len(m.logs)-maxRetainedLogs:]
	}
}

func (m clientAppModel) View() string {
	if m.quitting {
		return ""
	}

	width := m.width
	if width <= 0 {
		width = 160
	}

	sections := []string{
		m.renderHeader(width),
		m.renderBody(width),
		m.renderInput(width),
	}

	return lipgloss.NewStyle().Padding(1, 2).Render(strings.Join(sections, "\n\n"))
}

func (m clientAppModel) renderHeader(width int) string {
	connectionState := statusConnectedStyle.Render("CONNECTED")
	if !m.connected {
		connectionState = statusErrorStyle.Render("DISCONNECTED")
	}
	tabs := []string{
		m.renderTab("Cache", viewCache),
		m.renderTab("Rates", viewRates),
		m.renderTab("Help", viewHelp),
	}
	meta := fmt.Sprintf(
		"%s  %s  Active subscriptions: %d  Cached assets: %d  Updated: %s",
		connectionState,
		m.addr,
		m.subscriptions.Count(),
		len(m.cache.All()),
		m.now.Format("15:04:05"),
	)
	return strings.Join([]string{
		sectionTitleStyle.Render("Streams Adapter Client"),
		strings.Join(tabs, "  "),
		cacheMetaStyle.Render(truncate(meta, width-4)),
	}, "\n")
}

func (m clientAppModel) renderTab(label string, view appView) string {
	if m.view == view {
		return selectedTabStyle.Render("[" + label + "]")
	}
	return idleTabStyle.Render("[" + label + "]")
}

func (m clientAppModel) renderBody(width int) string {
	switch m.view {
	case viewCache:
		return m.renderCacheView(width)
	case viewRates:
		return m.renderRatesView(width)
	default:
		return m.renderHelpView(width)
	}
}

func (m clientAppModel) renderCacheView(width int) string {
	entries := m.cache.All()
	keys := make([]string, 0, len(entries))
	for key := range entries {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	obsWidth := m.observationWidth(width)
	lines := []string{
		cacheHeaderStyle.Render(fmt.Sprintf(
			"%s%s%s%s%s",
			padRight("CACHE KEY", cacheTableKeyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padRight("OBSERVATION", obsWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft("RATE/s", cacheTableRateWidth),
		)),
		cacheMetaStyle.Render(fmt.Sprintf(
			"%s%s%s%s%s",
			strings.Repeat("-", cacheTableKeyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			strings.Repeat("-", obsWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			strings.Repeat("-", cacheTableRateWidth),
		)),
	}

	if len(keys) == 0 {
		lines = append(lines, emptyStyle.Render("No observations yet."))
		return strings.Join(lines, "\n")
	}

	start, end := m.window(len(keys))
	for _, key := range keys[start:end] {
		entry := entries[key]
		lines = append(lines, fmt.Sprintf(
			"%s%s%s%s%s",
			padRight(truncate(key, cacheTableKeyWidth), cacheTableKeyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padRight(truncate(summarizeObservation(entry.ObservationJSON), obsWidth), obsWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft(fmt.Sprintf("%.4f", m.cache.Rate(key)), cacheTableRateWidth),
		))
	}

	if len(keys) > end-start {
		lines = append(lines, "", cacheMetaStyle.Render(fmt.Sprintf("Showing %d-%d of %d", start+1, end, len(keys))))
	}
	return strings.Join(lines, "\n")
}

func (m clientAppModel) renderRatesView(width int) string {
	entries := m.cache.All()
	keys := make([]string, 0, len(entries))
	for key := range entries {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		return m.cache.Rate(keys[i]) > m.cache.Rate(keys[j])
	})

	lastWidth := 8
	totalWidth := 10
	keyWidth := width - lastWidth - totalWidth - cacheTableRateWidth - (cacheTableGapWidth * 3) - 4
	if keyWidth < 30 {
		keyWidth = 30
	}

	lines := []string{
		cacheHeaderStyle.Render(fmt.Sprintf(
			"%s%s%s%s%s%s%s",
			padRight("PAYLOAD HASH", keyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft("RATE/s", cacheTableRateWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft("TOTAL", totalWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft("UPDATED", lastWidth),
		)),
	}

	if len(keys) == 0 {
		lines = append(lines, emptyStyle.Render("No observations yet."))
		return strings.Join(lines, "\n")
	}

	start, end := m.window(len(keys))
	for _, key := range keys[start:end] {
		entry, _ := m.cache.Get(key)
		lines = append(lines, fmt.Sprintf(
			"%s%s%s%s%s%s%s",
			padRight(truncate(key, keyWidth), keyWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft(fmt.Sprintf("%.4f", m.cache.Rate(key)), cacheTableRateWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft(fmt.Sprintf("%d", entry.Count), totalWidth),
			strings.Repeat(" ", cacheTableGapWidth),
			padLeft(entry.UpdatedAt.Format("15:04:05"), lastWidth),
		))
	}

	if len(keys) > end-start {
		lines = append(lines, "", cacheMetaStyle.Render(fmt.Sprintf("Showing %d-%d of %d", start+1, end, len(keys))))
	}
	return strings.Join(lines, "\n")
}

func (m clientAppModel) renderHelpView(width int) string {
	lines := []string{
		sectionTitleStyle.Render("Commands"),
		helpStyle.Render("help | h | ?"),
		helpStyle.Render(`subscribe payload='{"data":{...}}'`),
		helpStyle.Render("cache | rates | help | quit | q"),
		"",
		sectionTitleStyle.Render("Keys"),
		helpStyle.Render("Tab / Shift+Tab: switch views"),
		helpStyle.Render("PgUp / PgDn / Home / End: scroll table views"),
		helpStyle.Render("Enter: run command"),
		helpStyle.Render("q / Ctrl+C: quit"),
		"",
		sectionTitleStyle.Render("Notes"),
		helpStyle.Render(truncate("Active subscriptions is the number of unique payloads in each full snapshot. Cached observations are keyed by payload hash.", width-4)),
	}
	return strings.Join(lines, "\n")
}

func (m clientAppModel) renderInput(width int) string {
	status := cacheMetaStyle.Render(truncate("Status: "+m.statusMessage, width-4))
	help := helpStyle.Render("Type a command and press Enter. Tab switches views. q quits.")
	return strings.Join([]string{status, m.input.View(), help}, "\n")
}

func (m clientAppModel) observationWidth(width int) int {
	obsWidth := width - cacheTableKeyWidth - cacheTableRateWidth - (cacheTableGapWidth * 2) - 4
	if obsWidth < cacheTableObsMin {
		return cacheTableObsMin
	}
	return obsWidth
}

func (m clientAppModel) visibleRows() int {
	height := m.height
	if height <= 0 {
		return 22
	}
	rows := height - headerHeight - statusBarHeight - inputHeight - 4
	if rows < minTableRows {
		return minTableRows
	}
	return rows
}

func (m clientAppModel) window(total int) (int, int) {
	visible := m.visibleRows()
	maxOffset := total - visible
	if maxOffset < 0 {
		maxOffset = 0
	}
	offset := m.offset
	if offset > maxOffset {
		offset = maxOffset
	}
	if offset < 0 {
		offset = 0
	}
	end := offset + visible
	if end > total {
		end = total
	}
	return offset, end
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
