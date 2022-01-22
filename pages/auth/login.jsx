import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import { colors, EyeIcon, LeftArrowIcon, multiplier, shadows, SignInBackground, WambiLogo, WambiTagline } from '@assets'
import {
  Anchor,
  Card,
  Image,
  Input,
  Layout as LayoutBase,
  Loader,
  Modal,
  Paragraph,
  PillButton,
  SelfRegisterWorkflow,
  SignInHelpWorkflow,
  Title,
} from '@components'
import { useAuthContext, useLangContext, useUserContext } from '@contexts'
import { getExtraQueryParams, LANGUAGE_TYPE } from '@utils'

const BackArrow = styled.div`
  background: white;
  border-radius: 50%;
  box-shadow: ${shadows.card};
  display: flex;
  height: 24px;
  margin-right: ${multiplier}px;
  width: 24px;

  img {
    margin: auto;
  }
`

const BackToSignIn = styled.div`
  cursor: pointer;
  display: flex;
  margin-bottom: ${multiplier * 4}px;
`

const Content = styled(Card)`
  background-color: ${colors.white}D9;
  margin-bottom: ${multiplier * 4}px;
`

const Error = styled(Paragraph)`
  margin-bottom: ${multiplier * 3}px;
`

const Form = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: ${multiplier * 5}px ${multiplier * 3}px;
`

const Forgot = styled(Paragraph)`
  cursor: pointer;
  margin-top: ${multiplier * 4}px;
`

const Layout = styled(LayoutBase)`
  background-image: url(${SignInBackground});
  background-position: center center;
  background-size: cover;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: none;
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
`

const Logo = styled(Image)`
  margin: ${multiplier}px 0;
  transform: translateX(5px);
  width: 107px;
`

const SelfRegisterCard = styled(Card)`
  align-items: center;
  background-color: ${colors.white}D9;
  display: flex;
  flex-direction: column;
  padding: ${multiplier * 3}px ${multiplier * 4}px;
  text-align: center;
`

const SignUpLink = styled(Anchor)`
  margin-top: ${multiplier * 2}px;
`

const SsoPillButton = styled(PillButton)`
  margin: ${multiplier * 6}px 0 ${multiplier * 4}px;
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0 auto;
  max-width: 415px;
  overflow: auto;
  padding: ${multiplier * 9}px ${multiplier * 3}px;
`

const LoginPage = () => {
  const { clientAccount, isAuthenticated } = useAuthContext()
  const { getAccountLanguage } = useLangContext()
  const ref = useRef(null)
  const router = useRouter()
  const { login } = useUserContext()

  const [disabled, setDisabled] = useState(true)
  const [error, setError] = useState(null)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [seePassword, setSeePassword] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSelfRegister, setShowSelfRegister] = useState(false)
  const [showSignInHelp, setShowSignInHelp] = useState(false)
  const [submitting, setSubmitting] = useState(true)

  const queryUrl = router.query.prevUrl

  const canSubmit = useCallback(() => {
    const validPassword = password.length > 0
    const validUsername = loginId.length > 0

    if (validPassword && validUsername) return setDisabled(false)
    setDisabled(true)
  }, [loginId, password])

  const handleSSO = () => {
    const { prevUrl } = router.query
    const extraQuery = getExtraQueryParams(router.query)
    const query = prevUrl ? `?prevUrl=${prevUrl + extraQuery}` : ''
    setSubmitting(true)

    if (clientAccount?.settings?.ssoProvider) {
      if (clientAccount.settings.ssoProvider === 'saml2') router.push(`/api/site/sso/saml2/login${query}`)
      else router.push(`/api/site/oauth/${clientAccount.settings.ssoProvider}/login${query}`)
    }
  }

  const _submit = async e => {
    e?.preventDefault()
    setSubmitting(true)

    const { msg, success } = await login(loginId, password)

    // Remove terms query param so useEffect can push route to /complete...JC
    if (queryUrl === 'terms') {
      router.replace({ pathname: '/auth/complete', query: {} })
    }

    if (!success) {
      setSubmitting(false)
      setError(msg)
    }
  }

  useEffect(() => {
    setError('')
  }, [loginId, password])

  useEffect(() => {
    canSubmit()
  }, [canSubmit])

  // if no ssoProvider, automatically show the form...JK
  useEffect(() => {
    if (clientAccount?.settings?.ssoProvider) setShowForm(false)
    else setShowForm(true)
  }, [clientAccount])

  useEffect(() => {
    const extraQuery = getExtraQueryParams(router.query)
    const query = queryUrl ? { prevUrl: queryUrl + extraQuery } : {}

    if (isAuthenticated && queryUrl !== 'terms') {
      router.push({
        pathname: '/auth/complete',
        query,
      })
    } else setSubmitting(false)
  }, [isAuthenticated, queryUrl, router])

  useEffect(() => {
    // auto focus username input on initial render...PS
    if (showForm) ref?.current?.focus()
  }, [showForm])

  return (
    <Layout auto full head='Wambi' id='login' loading={!clientAccount} noFooter noHeader scroll>
      <Wrapper>
        {showForm && (
          <BackToSignIn id='back-to-sign-in-options' onClick={() => setShowForm(false)}>
            <BackArrow>
              <Image src={LeftArrowIcon} />
            </BackArrow>
            <Paragraph color='blurple' fontWeight={700}>
              Back to sign in options
            </Paragraph>
          </BackToSignIn>
        )}
        <Content>
          <Form onSubmit={_submit}>
            <Image alt='Wambi logo' src={WambiLogo} width={showForm ? '65px' : '107px'} />
            {showForm ? (
              <>
                <Input
                  autoCapitalize='none'
                  border
                  label='Username'
                  onChange={e => setLoginId(e.target.value)}
                  ref={ref}
                  showLabel
                  spacing={`${multiplier * 7}px 0 0`}
                  value={loginId}
                />
                <Input
                  border
                  handleAction={() => setSeePassword(seePassword => !seePassword)}
                  icon={EyeIcon}
                  label='Password'
                  onChange={e => setPassword(e.target.value)}
                  showLabel
                  spacing={`${multiplier * 4}px 0 ${multiplier * 5}px`}
                  type={seePassword ? 'text' : 'password'}
                  value={password}
                />
                {error && (
                  <Error color='berry' id='sign-in-error' fontWeight={700}>
                    {error}
                  </Error>
                )}
                <PillButton disabled={disabled} full id='sign-in-btn' text='Sign In' type='submit' />
                <Forgot color='blurple' fontWeight={700} id='trouble-signing-in' onClick={() => setShowSignInHelp(true)}>
                  Sign in with a code
                </Forgot>
              </>
            ) : (
              <>
                <Logo alt='Wambi word logo' src={WambiTagline} />
                <Title fontSize='18px' fontWeight={400}>
                  Sign in to Wambi
                </Title>
                <SsoPillButton onClick={handleSSO} id='sso-login' text={`${clientAccount?.name} Single Sign On`} />
                <Anchor
                  color='blurple'
                  fontSize='18px'
                  id='non-sso-login'
                  onClick={() => setShowForm(true)}
                  text="I don't have Single Sign On"
                />
              </>
            )}
          </Form>
        </Content>
        {showForm && clientAccount?.settings?.selfRegister?.emailDomains && clientAccount?.settings?.selfRegister?.groupId && (
          <SelfRegisterCard>
            <Paragraph>{getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTER_SIGN_UP_BUTTON_TEXT)}</Paragraph>
            <SignUpLink
              color='blurple'
              fontWeight={700}
              id='self-registered-user-sign-up'
              onClick={() => setShowSelfRegister(true)}
              text='Sign up'
            />
          </SelfRegisterCard>
        )}
        {!showForm && (
          <PillButton
            id='patient-portal-login'
            inverted
            onClick={() => router.push('/portal')}
            text={getAccountLanguage(LANGUAGE_TYPE.PORTAL_BUTTON)}
          />
        )}
      </Wrapper>
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
      <Modal open={showSignInHelp} shrink>
        <SignInHelpWorkflow handleBack={() => setShowSignInHelp(false)} />
      </Modal>
      <Modal open={showSelfRegister} shrink>
        <SelfRegisterWorkflow handleBack={() => setShowSelfRegister(false)} />
      </Modal>
    </Layout>
  )
}

export default LoginPage
