import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, DaisyLogo, devices } from '@assets'
import { Card, Image, Modal, Paragraph, Title } from '@components'
import { useLangContext } from '@contexts'

const Body = styled(Paragraph)`
  text-align: center;
`

const Divider = styled.div`
  @media (${devices.tablet}) {
    border: 1px solid ${colors.gray6};
    height: 1px;
    margin-bottom: 0.5rem;
    width: 100%;
  }
`

const Header = styled(Title)`
  padding: 2rem 1.5rem 2rem 1.5rem;

  @media (${devices.tablet}) {
    font-size: 18px;
    padding: 1rem 0;
  }
`

const ImageWrapper = styled(Card)`
  margin: 31px auto 38px;
  padding: 11px;
  width: 176px;

  img {
    width: 100%;
  }

  @media (${devices.tablet}) {
    width: 200px;
  }
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 2rem 1.5rem;
  width: 337px;

  @media (${devices.tablet}) {
    width: 632px;
    padding: 1rem 3rem 2rem;
  }
`

const DaisyModal = ({ handleClose, open }) => {
  const { getText } = useLangContext()

  return (
    <Modal animationType='slideUp' open={open} handleClose={handleClose} small>
      <Wrapper>
        <ImageWrapper borderRadius='12px'>
          <Image alt='Daisy Award' src={DaisyLogo} />
        </ImageWrapper>
        <Divider />
        <Header color='gray2' fontSize='16px'>
          {getText('What is the DAISY Award?')}
        </Header>
        <Body color='gray2' fontSize='14px'>
          {getText(
            'The DAISY Award celebrates nurses who provide extraordinary compassionate and skillful care every day. An acronym for Diseases Attacking the Immune System. The DAISY Foundation was formed in November 1999, by the family of J. Patrick Barnes who died at age 33 of complications of Idiopathic Thrombocytopenic Purpura (ITP). The nursing care Patrick received when hospitalized profoundly touched his family.'
          )}
        </Body>
      </Wrapper>
    </Modal>
  )
}

DaisyModal.propTypes = {
  handleClose: PropTypes.func,
  open: PropTypes.bool,
}

export default DaisyModal
