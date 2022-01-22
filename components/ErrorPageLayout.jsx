import styled from 'styled-components'
import PropTypes from 'prop-types'
import DocumentHead from 'next/head'

import { colors, devices } from '@assets'
import { DynamicContainer, Image, PillButton, Text, Title as TitleBase } from '@components'
import { useAuthContext } from '@contexts'

const Context = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 260px;

  @media (${devices.tablet}) {
    align-items: start;
    justify-content: start;
    width: 400px;
  }
`

const ErrorButton = styled(PillButton)`
  margin: 5px 0;
`

const ErrorImage = styled(Image)`
  @media (${devices.tablet}) {
    width: 500px;
  }
`

const ErrorText = styled(Text)`
  margin-bottom: 40px;
  text-align: center;

  @media (${devices.tablet}) {
    font-size: 20px;
    text-align: left;
  }
`

const Title = styled(TitleBase)`
  margin: 30px 0;
  text-align: center;

  @media (${devices.tablet}) {
    font-size: 36px;
    text-align: left;
  }
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  background-color: ${colors.gray7};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 40px 0 120px 0;

  @media (${devices.tablet}) {
    flex-direction: row;
    justify-content: space-evenly;
    padding: 0;
  }
`

const ErrorPageLayout = ({ alt = 'error image', cta, image, support, text, title }) => {
  const { clientAccount } = useAuthContext()

  const supportHandler = () => {
    if (clientAccount) window.location = clientAccount.settings.helpSupportUrl
  }

  return (
    <>
      <DocumentHead>
        <link rel='icon' href='/public/favicon.ico' />
        <title>Wambi</title>
      </DocumentHead>
      <Wrapper fixed>
        <ErrorImage alt={alt} src={image} width='300px' />
        <Context>
          <Title fontSize='24px' fontWeight='600'>
            {title}
          </Title>
          <ErrorText color='black' noClamp font-weight='400'>
            {text}
          </ErrorText>
          {cta && <ErrorButton {...cta} id='err-page-return-home-btn' />}
          {support && <ErrorButton id='err-page-support-btn' text='Tell us what happened' onClick={() => supportHandler()} />}
        </Context>
      </Wrapper>
    </>
  )
}

ErrorPageLayout.propTypes = {
  alt: PropTypes.string,
  cta: PropTypes.object,
  image: PropTypes.string.isRequired,
  support: PropTypes.bool,
  text: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}

export default ErrorPageLayout
