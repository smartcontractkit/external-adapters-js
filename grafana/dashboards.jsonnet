local eaDetailed = import './generated/eaDetailed.json';
local eaOverview = import './generated/eaOverview.json';
local eaRelease = import './generated/eaRelease.json';

{
  grafanaDashboards:: {
    'ea-detailed': eaDetailed.dashboard,
    'ea-overview': eaOverview.dashboard,
    'ea-release': eaRelease.dashboard,
  },
}
