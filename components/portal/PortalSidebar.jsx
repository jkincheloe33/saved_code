import PropTypes from 'prop-types'
import { parseCookies } from 'nookies'
import styled from 'styled-components'
import { useRouter } from 'next/router'

import { colors, devices, MapIcon, shadows, WambiLogo } from '@assets'
import { Anchor, Image, LanguageSelector, LocationTile, Text } from '@components'
import { useAuthContext, useLangContext, useReviewerContext } from '@contexts'
import { api } from '@services'
import { useStore } from '@utils'

const ChangeLocationText = styled(Text)`
  padding-top: 20px;
`

const LanguageWrapper = styled.div`
  align-self: flex-start;
  border-bottom: 1px solid ${colors.gray8};
  cursor: pointer;
  padding: 30px;
  width: 100%;
`

const LinksWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const Location = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
`

const LocationButton = styled.button`
  background-color: ${colors.white};
  border: none;
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  height: 48px;
  padding: 0.5rem;
  margin: 0;
  width: 48px;

  img {
    height: 29px;
    width: 18px;
  }

  @media (${devices.tablet}) {
    height: 68px;
    margin: auto;
    padding: 0.75rem;
    width: 68px;

    img {
      height: 42px;
      width: 26px;
    }
  }
`

const LocationWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 50px 0;
  padding: 20px 0;
  text-align: center;

  @media (${devices.tablet}) {
    padding: 0;
  }
`

const Logo = styled(Image)`
  width: 45px;
`

const MenuLink = styled(Anchor)`
  align-self: flex-start;
  border-bottom: 1px solid ${colors.gray8};
  cursor: pointer;
  padding: 30px;
  width: 100%;
`

const TopRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${colors.gray8};
  display: flex;
  padding: 20px;
  width: 100%;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding-bottom: 100px;
  width: 272px;

  @media (${devices.tablet}) {
    padding-bottom: 0;
    width: 385px;
  }
`

const VolunteerText = styled(Text)`
  margin-left: 15px;
`

const PortalSidebar = ({ handleStartOver, setExpanded, setOpenVolunteerModal }) => {
  const {
    clientAccount: {
      settings: { helpSupportUrl },
    },
  } = useAuthContext()

  const { getText } = useLangContext()
  const { resetReviewerContext, reviewer } = useReviewerContext()
  const { firstName, isVolunteer, peopleId } = { ...reviewer }

  const { review_tkn } = parseCookies()

  const validReviewTkn = review_tkn?.split('.')[2]
  const validNewVolunteer = validReviewTkn && reviewer && !peopleId && !isVolunteer
  const validReturningVolunteer = reviewer && isVolunteer > 0

  const router = useRouter()
  const [, { lang, portalState: { location }, reset }, ] = useStore() // prettier-ignore

  const handleSignOut = async () => {
    await reset()
    await api.post('/portal/signOut')
    router.push('/auth/login')
    resetReviewerContext()
  }

  return (
    <Wrapper>
      <LinksWrapper>
        <TopRow>
          <Logo alt='Wambi Logo' src={WambiLogo} />
          {validReturningVolunteer && (
            <VolunteerText color='darkBlue' fontWeight='500'>
              {`${lang === 'es' ? '\u00a1' : ''}${getText('Welcome')}, ${firstName || ''}!`}
            </VolunteerText>
          )}
        </TopRow>
        <MenuLink fontWeight='700' id='help-btn' link={helpSupportUrl} rel='noopener noreferrer' target='_blank' text={getText('Help')} />
        <MenuLink
          fontWeight='700'
          id='info-btn'
          link='https://wambi.org'
          rel='noopener noreferrer'
          target='_blank'
          text={getText('Information')}
        />
        {validNewVolunteer && (
          <MenuLink
            fontWeight='700'
            id='sign-out-btn'
            onClick={() => {
              setExpanded(false)
              setOpenVolunteerModal(true)
            }}
            //eslint-disable-next-line
            text={getText("I'm a volunteer")}
          />
        )}
        {location?.disableTranslations === 0 && (
          <LanguageWrapper>
            <LanguageSelector sidebar />
          </LanguageWrapper>
        )}
        {validReviewTkn && <MenuLink fontWeight='700' id='sign-out-btn' onClick={handleSignOut} text={getText('Sign out')} />}
      </LinksWrapper>
      {location && handleStartOver && (
        <LocationWrapper id='change-location-div'>
          <LocationTile column={true} location={location} showLargeBadge />
          <Location id='change-location-btn' onClick={handleStartOver}>
            <LocationButton>
              <Image alt='Map icon' src={MapIcon} />
            </LocationButton>
            <ChangeLocationText color='digitalBlue' fontWeight='700'>
              {getText('Change Location')}
            </ChangeLocationText>
          </Location>
        </LocationWrapper>
      )}
    </Wrapper>
  )
}

PortalSidebar.propTypes = {
  handleStartOver: PropTypes.func,
  setExpanded: PropTypes.func,
  setOpenVolunteerModal: PropTypes.func,
}

export default PortalSidebar
