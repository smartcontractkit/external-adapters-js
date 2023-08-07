// create panel widths based on relative sizes
local mapWidth(panels) =
  // 24 sections per grafana row
  local totalWidth = 24;
  local totalPanelSize = std.foldl(function(prev, next) prev + next.size, panels, 0);
  std.mapWithIndex(function(index, panel) panel { width:: std.floor((panel.size / totalPanelSize) * totalWidth) }, panels);

// create a grafana compatible row
// with dynamic width + fixed height support
local createRow(panels, y, height) =
  std.mapWithIndex(
    function(index, panel)
      panel {
        gridPos+: {
          h: height,
          w: panel.width,
          y: y,
          x: std.foldl(
            function(prev, next) prev + next.width,
            panels[0:index:1],
            0
          ),
        },
      },
    panels
  );

// Create a grid layout with a fixed height per-row
// and a dynamic width per row element
local createGrid(rows) =
  std.flattenArrays(std.mapWithIndex(
    function(index, row)
      createRow(
        mapWidth(row.panels),
        std.foldl(
          function(prev, next) prev + next.height,
          rows[0:index:1],
          0
        ),
        row.height
      )
    ,
    rows
  ));


{
  createGrid:: createGrid,
}
