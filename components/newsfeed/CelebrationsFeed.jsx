import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CelebrationItem, PillButton, Title, ViewAllCelebrations } from '@components'

const HeaderWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`

const Wrapper = styled.div`
  padding: 20px;
`

const CelebrationsFeed = ({ feedItem, setSeeMoreCelebrations, setShowSeeMoreCelebrations, showSeeMore }) => (
  <Wrapper>
    <HeaderWrapper>
      <Title>Celebrations</Title>
      <PillButton
        buttonType='secondary'
        id='view-all-celebrations-btn'
        onClick={() => {
          setSeeMoreCelebrations({
            component: ViewAllCelebrations,
            props: { handleBack: () => setShowSeeMoreCelebrations(false), open: !showSeeMore },
          })
          setShowSeeMoreCelebrations(true)
        }}
        small
        text='View all'
      />
    </HeaderWrapper>
    <CelebrationItem celebrationList={feedItem.celebrations}></CelebrationItem>
  </Wrapper>
)

CelebrationsFeed.propTypes = {
  feedItem: PropTypes.object.isRequired,
  setSeeMoreCelebrations: PropTypes.func,
  setShowSeeMoreCelebrations: PropTypes.func,
  setShowSeeMore: PropTypes.func,
  showSeeMore: PropTypes.bool,
}

export default CelebrationsFeed
