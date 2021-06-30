local eaDetailed = import './generated/eaDetailed.json';
local eaOverview = import './generated/eaOverview.json';
{
  grafanaDashboards:: {
    'ea-detailed': eaDetailed.dashboard,
    'ea-overview': eaOverview.dashboard,
  },
}
