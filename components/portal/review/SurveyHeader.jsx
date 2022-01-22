import PropTypes from 'prop-types'
import styled from 'styled-components'

import { WambiLogo } from '@assets'
import { ScreenNavigation } from '@components'
import { useLangContext } from '@contexts'

const FlexItems = styled.div`
  flex: 0 0 33.3%;
  width: 33.3%;

  &:nth-of-type(2) {
    display: flex;
    justify-content: center;
  }

  &:last-of-type {
    text-align: right;
  }
`

const Logo = styled.img`
  width: 60px;
`

const StyledHeader = styled.header`
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 70px;
  padding: 20px 20px 0;
  width: 100%;
`

const SurveyHeader = ({ children, onBackPress = () => {}, onSkipPress }) => {
  const { getText } = useLangContext()

  return (
    <StyledHeader>
      <FlexItems>
        <ScreenNavigation id='survey-back-btn' onClick={onBackPress} text={getText('BACK')} />
      </FlexItems>
      <FlexItems>{children}</FlexItems>
      <FlexItems>
        {onSkipPress ? (
          <ScreenNavigation flip id='survey-skip-btn' onClick={onSkipPress} text={getText('SKIP')} />
        ) : (
          <Logo alt='Wambi Logo' src={WambiLogo} />
        )}
      </FlexItems>
    </StyledHeader>
  )
}

SurveyHeader.propTypes = {
  children: PropTypes.any,
  onBackPress: PropTypes.func,
  onSkipPress: PropTypes.func,
}

export default SurveyHeader
