import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { DynamicContainer, Layout, Loader } from '@components'
import { FEED_ITEM_TYPES } from '@utils'

const Container = styled(DynamicContainer)`
  padding: 20px 0;

  @media (${devices.largeDesktop}) {
    padding: 0;
  }
`

const ViewDetails = ({ handleBack, profile = false, setActive, setViewDetailsData, viewDetailsData }) => {
  const back = () => {
    handleBack()
    setTimeout(() => setViewDetailsData(null), 500)
  }

  const renderComponent = ({ component, props }) => {
    const Component = component

    return <Component {...props} setActive={setActive} />
  }

  return (
    <Layout
      cta={viewDetailsData.props.cta ?? { onClick: back, text: 'Close' }}
      handleBack={back}
      id='view-details'
      inner
      noFooter
      title={!viewDetailsData ? '' : viewDetailsData.props.feedItem?.itemType === FEED_ITEM_TYPES.CPC || profile ? 'Wambi' : 'Post'}
    >
      <Container>{viewDetailsData ? renderComponent(viewDetailsData) : <Loader />}</Container>
    </Layout>
  )
}

ViewDetails.propTypes = {
  handleBack: PropTypes.func,
  profile: PropTypes.bool,
  setActive: PropTypes.func,
  setViewDetailsData: PropTypes.func,
  viewDetailsData: PropTypes.object,
}

export default ViewDetails
