local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local template = grafana.template;
local layout = import './layout.libsonnet';


/**
 * Constants
 */
local prometheusNamespace = std.extVar('prometheusNamespace');
local cortexDataSource = std.extVar('cortexDataSource');
local instanceFilter = 'namespace="$namespace",service=~"$service.*"';
local appFilter = 'namespace="$namespace",app_name=~"$adapter.*"';
local filterType = std.extVar('filterType');
local eaSelector = if filterType == "app" then appFilter else instanceFilter;
local interval = '[$__rate_interval]';

/**
 * Templates
 */

local createTemplates(multiService) =
  local namespaceTempl = template.custom('namespace', query=prometheusNamespace, current=prometheusNamespace, hide=true);
  local serviceTempl = template.new(
    'service',
    datasource=cortexDataSource,
    query='http_request_duration_seconds_bucket',
    multi=multiService,
    sort=1,
    regex='/.*namespace="' + prometheusNamespace + '".*service="(.*)"/',
    current=if multiService then 'All' else null,
    includeAll=multiService,
    refresh='load'
  );
  local feedTempl = template.new(
    'feed',
    datasource=cortexDataSource,
    query='cache_data_get_values{namespace="$namespace"}',
    multi=true,
    sort=1,
    current='All',
    regex='/feed_id="(.*?)"/',
    includeAll=true,
    refresh='load'
  );
  local adapterTempl = template.new(
    'adapter',
    datasource=cortexDataSource,
    query='http_requests_total{namespace="$namespace"}',
    multi=true,
    sort=1,
    current='All',
    regex='/app_name="(.*?)"/',
    includeAll=true,
    refresh='load'
  );
  local eaTempl = if filterType == "app" then adapterTempl else serviceTempl;
  [
    namespaceTempl,
    feedTempl,
    eaTempl,
  ];

local addSideLegend(graphPanel) =
  local sideLegend = {
    alignAsTable: true,
    rightSide: true,
    current: true,
    values: true,
    sort: 'current',
    sortDesc: true,
  };

  graphPanel {
    legend+: sideLegend,
  };


local createDashboard(templates, grid) =
  local dashboardConfig = {
    title: std.extVar('dashboardTitle'),
    uid: std.extVar('dashboardUid'),
  };
  {
    dashboard: dashboard.new(
      dashboardConfig.title,
      uid=dashboardConfig.uid,
      editable=true,
      schemaVersion=26,
      refresh='5s',
    )
               .addTemplates(templates)
               .addPanels(layout.createGrid(grid)),
  };

{
  helpers: {
    addSideLegend: addSideLegend,
    createDashboard: createDashboard,
  },
  constants: {
    cortexDataSource: cortexDataSource,
    eaSelector: eaSelector,
    interval: interval,
  },
  createTemplates: createTemplates,
}
