import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { ViewDetails } from '@components'

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  background-color: ${colors.white};
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  opacity: ${p => (p.open ? 1 : 0)};
  transition: opacity 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
`

const ViewDetailsWorkflow = ({
  active,
  handleBack,
  profile = false,
  recipientsData,
  seeMoreComments,
  seeMoreCPCs,
  setActive,
  setViewDetailsData,
  viewDetails,
  viewDetailsData,
}) => {
  const viewDetailsProps = {
    handleBack,
    profile,
    setViewDetailsData,
    viewDetailsData,
  }

  const components = [
    {
      Component: seeMoreCPCs && seeMoreCPCs.component,
      data: seeMoreCPCs && { ...seeMoreCPCs.props },
    },
    {
      Component: viewDetailsData && ViewDetails,
      data: viewDetailsProps,
    },
    {
      Component: recipientsData && recipientsData.component,
      data: recipientsData && { ...recipientsData.props },
    },
    {
      Component: seeMoreComments && seeMoreComments.component,
      data: seeMoreComments && { ...seeMoreComments.props },
    },
  ]

  return (
    <Wrapper open={viewDetails}>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && <Component {...data} active={active} setActive={setActive} />}
        </Container>
      ))}
    </Wrapper>
  )
}

ViewDetailsWorkflow.propTypes = {
  active: PropTypes.number.isRequired,
  handleBack: PropTypes.func,
  profile: PropTypes.bool,
  recipientsData: PropTypes.object,
  seeMoreComments: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  seeMoreCPCs: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  setActive: PropTypes.func.isRequired,
  setViewDetailsData: PropTypes.func,
  viewDetails: PropTypes.bool,
  viewDetailsData: PropTypes.object,
}

export default ViewDetailsWorkflow
