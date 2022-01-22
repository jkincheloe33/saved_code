import PropTypes from 'prop-types'
import styled from 'styled-components'

import { InsightItem, DynamicContainer, Layout } from '@components'
import { useUserContext } from '@contexts'

const Wrapper = styled(DynamicContainer)`
  padding: 0 20px;
`

const ViewAllInsights = ({ handleBack }) => {
  const { insightList, setInsightList } = useUserContext()
  return (
    <Layout
      cta={{ onClick: handleBack, text: 'Close' }}
      handleBack={handleBack}
      id='view-all-insights'
      inner
      noFooter
      title='Actionable Insights'
    >
      <Wrapper>
        {insightList.map((insight, i) => (
          <InsightItem insight={insight} key={i} setInsightList={setInsightList} />
        ))}
      </Wrapper>
    </Layout>
  )
}

ViewAllInsights.propTypes = {
  handleBack: PropTypes.func,
}

export default ViewAllInsights
