import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, multiplier } from '@assets'
import { FeatureWidget, WambiItem, WambiList } from '@components'
import { NEWSFEED_VIEW } from '@utils'

const WambiWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  margin-left: -${multiplier * 2}px;
  overflow: hidden;
  width: calc(100% + ${multiplier * 4}px);

  @media (${devices.largeDesktop}) {
    align-items: stretch;
    flex-direction: row;
  }
`

const Wrapper = styled.div`
  @media (${devices.largeDesktop}) {
    margin-top: 30px;
  }
`

const WambiWidget = ({ cpc, myProfile, setActive, setSeeMoreCPCs, setViewDetails, ...props }) => {
  return (
    <Wrapper>
      <FeatureWidget
        border
        title={`${myProfile ? 'My ' : ''} Wambis`}
        viewAll={{
          id: 'view-all-cpc-btn',
          onClick: () => {
            setSeeMoreCPCs({
              component: WambiList,
              props: {
                ...props,
                handleBack: () => {
                  setSeeMoreCPCs(null)
                  setViewDetails(false)
                },
                setSeeMoreCPCs,
              },
            })
            setActive(NEWSFEED_VIEW.VIEW_ALL)
            setViewDetails(true)
          },
        }}
      >
        <WambiWrapper>
          {cpc.map((item, i) => {
            return (
              <WambiItem
                {...props}
                cpc={item}
                cta={{ onClick: () => setViewDetails(false), text: 'Close' }}
                handleBack={() => setViewDetails(false)}
                key={i}
                setActive={setActive}
                setSeeMoreCPCs={setSeeMoreCPCs}
                setViewDetails={setViewDetails}
              />
            )
          })}
        </WambiWrapper>
      </FeatureWidget>
    </Wrapper>
  )
}

WambiWidget.propTypes = {
  cpc: PropTypes.array,
  handleBack: PropTypes.func,
  myProfile: PropTypes.bool,
  setActive: PropTypes.func.isRequired,
  setSeeMoreCPCs: PropTypes.func.isRequired,
  setViewDetails: PropTypes.func,
}

export default WambiWidget
