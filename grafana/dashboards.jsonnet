local ea = import './generated/ea.json';
local eaOverview = import './generated/eaOverview.json';
{
  grafanaDashboards:: {
    [ea.name]: ea.dashboard,
    'ea-overview': eaOverview.dashboard,
  },
}
