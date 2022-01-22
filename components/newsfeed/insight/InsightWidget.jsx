import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { FeatureWidget, InsightItem, ViewAllInsights } from '@components'
import { useUserContext } from '@contexts'
import { api } from '@services'

const InsightWidget = ({ setSeeAllInsight, setShowAllInsights }) => {
  const { insightList, setInsightList } = useUserContext()

  useEffect(() => {
    if (insightList.length === 0) {
      setSeeAllInsight(null)
      setShowAllInsights(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightList])

  //Number of insight shown...CY
  const insightLimit = 3

  useEffect(() => {
    const getInsights = async () => {
      const {
        data: { success, insights },
      } = await api.get('/insights/list')
      if (success) setInsightList(insights)
    }

    getInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    insightList.length !== 0 && (
      <FeatureWidget
        title='Actionable Insights'
        viewAll={{
          id: 'view-all-insights-btn',
          onClick: () => {
            setSeeAllInsight({
              component: ViewAllInsights,
              props: { handleBack: () => setShowAllInsights(false) },
            })
            setShowAllInsights(true)
          },
        }}
      >
        {insightList.slice(0, insightLimit).map((insight, i) => (
          <InsightItem insight={insight} key={i} setInsightList={setInsightList} />
        ))}
      </FeatureWidget>
    )
  )
}

InsightWidget.propTypes = {
  setSeeAllInsight: PropTypes.func,
  setShowAllInsights: PropTypes.func,
}

export default InsightWidget
