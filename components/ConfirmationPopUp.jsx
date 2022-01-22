import PropTypes from 'prop-types'
import styled from 'styled-components'

import { PillButton, PopUp, Text } from '@components'

const Cancel = styled(PillButton)`
  margin: 25px 0;
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 25px;
  text-align: center;
`

const ConfirmationPopUp = ({ handleNo, handleYes, open }) => (
  <PopUp background handleClose={handleNo} isNested open={open}>
    <Wrapper>
      <Text>Are you sure?</Text>
      <Cancel id='confirmation-yes-button' onClick={handleYes} text='Yes' thin />
      <PillButton id='confirmation-no-button' inverted onClick={handleNo} text='No' thin />
    </Wrapper>
  </PopUp>
)

ConfirmationPopUp.propTypes = {
  handleNo: PropTypes.func.isRequired,
  handleYes: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
}

export default ConfirmationPopUp
