import PropTypes from 'prop-types'

export const CpcWorkflowType = {
  active: PropTypes.number,
  cpcData: PropTypes.object,
  cpcScreens: PropTypes.object,
  cta: PropTypes.object,
  scheduledAt: PropTypes.object,
  setActive: PropTypes.func.isRequired,
  setCpcData: PropTypes.func.isRequired,
  setScheduledAt: PropTypes.func,
}

// share propTypes from analytics widgets...JK
export const WidgetType = {
  dateRange: PropTypes.object,
  description: PropTypes.string,
  endDate: PropTypes.any,
  filterGroups: PropTypes.array,
  filterTraits: PropTypes.array,
  id: PropTypes.number,
  index: PropTypes.number,
  name: PropTypes.string,
  onClick: PropTypes.object,
  reports: PropTypes.array,
  setSelectedReport: PropTypes.func,
  setSubWidget: PropTypes.func,
  setWidgetLoadingState: PropTypes.func,
  startDate: PropTypes.any,
  widgets: PropTypes.array,
  widgetType: PropTypes.number,
}
