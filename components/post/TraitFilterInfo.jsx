/* eslint-disable no-unused-vars */
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { DownArrowIcon1 } from '@assets'
import { Image, PillButton, Text } from '@components'

const defaultText = 'Everyone'

const DropDownText = styled(Text)`
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LabelText = styled(Text)`
  line-height: 30px;
  max-width: 158px;
`

const TraitTab = styled(PillButton)`
  line-height: 140.62%;
  max-width: 185px;
  min-width: ${p => (p.textLength >= 13 ? '190px' : '130px')};
  padding-right: 5px;

  Button {
    align-items: center;
    display: flex;

    *:first-child {
      flex-grow: 1;
    }
  }
`

const TraitsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`

const TraitFilterInfo = ({ traitsText, setOpenTraits }) => {
  return (
    <TraitsWrapper>
      <LabelText>Who can see this?</LabelText>
      {/* <TraitTab
        TODO: commented out for UAT...JK
        
        buttonType='tertiary'
        id='post-who-can-see-btn'
        onClick={() => setOpenTraits(true)}
        small
        text=''
        textLength={traitsText ? traitsText.length : defaultText.length}
      >
        <DropDownText>{traitsText ?? defaultText}</DropDownText>
        <Image alt='down arrow icon' src={DownArrowIcon1} width='11px' />
      </TraitTab> */}
    </TraitsWrapper>
  )
}

TraitFilterInfo.propTypes = {
  setOpenTraits: PropTypes.func,
  traitsText: PropTypes.string,
}

export default TraitFilterInfo
