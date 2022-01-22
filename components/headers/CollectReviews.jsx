import { useEffect, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { colors, devices } from '@assets'
import { Card, CtaFooter, DynamicContainer, Layout, PillButton, Text, Title } from '@components'
import { useAuthContext, useReviewerContext, useToastContext, useUserContext } from '@contexts'
import { api } from '@services'

const CardWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
`

const PortalCard = styled(Card)`
  cursor: pointer;
  margin-top: 1rem;
  padding: 0 1rem;
`

const PortalItemWrapper = styled.div`
  &:not(:last-of-type) {
    border-bottom: 1px solid ${colors.gray3}20;
  }
`

const PortalItem = styled.div`
  background: ${p => p.selected && `${colors.gray8}`};
  border-radius: 15px;
  margin: 1rem;
  padding: 1rem;
`

const Wrapper = styled(DynamicContainer)`
  padding: 28px 20px 150px;

  @media (${devices.largeDesktop}) {
    width: 475px;
  }
`

const CollectReviews = ({ handleBack }) => {
  const { clientAccount } = useAuthContext()
  const { setReviewer } = useReviewerContext()
  const { setToastData } = useToastContext()
  const { logout, user } = useUserContext()
  const { email, mobile } = user

  const { push } = useRouter()

  const [portals, setPortals] = useState(null)
  const [selectedPortal, setSelectedPortal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const back = () => {
    setPortals(null)
    setSelectedPortal(null)
    handleBack()
  }

  useEffect(() => {
    setIsLoading(true)

    const getUserPortals = async () => {
      const {
        data: { portals, success },
      } = await api.get('/users/getPortals')

      if (success) {
        if (portals.length === 1) handleCollectReviews(portals[0])
        else {
          setPortals(portals)
          setIsLoading(false)
        }
      }
    }
    getUserPortals()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCollectReviews = async portal => {
    setIsLoading(true)
    const {
      data: { reviewer, success },
    } = await api.post('/auth/getEmployeeReviewTkn', { email, mobile })

    if (success) {
      const url = `/portal?id=${portal.shortUid}`
      setReviewer(reviewer)

      if (clientAccount?.settings?.surveys?.disableCollectWambisLogout !== true) {
        setToastData({
          bgColor: 'fuschia',
          callout: 'You are being signed out and taken to the Wambi portal.',
          id: 'logging-out-toast',
        })
        setTimeout(async () => await logout(url), 5000)
      } else {
        push(url)
      }
    } else {
      setIsLoading(false)
    }
  }

  return (
    <Layout
      cta={{ onClick: back, text: 'Close' }}
      handleBack={back}
      id='collectWambis'
      inner
      loading={isLoading}
      noFooter
      title='Collect Wambis'
    >
      <Wrapper outer>
        <CardWrapper>
          <Title color='gray1' fontSize='16px'>
            {portals?.length ? 'Select a portal:' : 'This user is not in any portals'}
          </Title>
          <PortalCard>
            {portals?.length > 0 &&
              portals.map((p, i) => (
                <PortalItemWrapper id={`portal-${i}`} key={i}>
                  <PortalItem selected={p.id === selectedPortal?.id} onClick={() => setSelectedPortal(p)}>
                    <Text color='gray1'>{p.name}</Text>
                  </PortalItem>
                </PortalItemWrapper>
              ))}
          </PortalCard>
        </CardWrapper>
      </Wrapper>
      <CtaFooter>
        <PillButton
          disabled={!selectedPortal}
          full
          id='collect-wambis-btn'
          onClick={() => handleCollectReviews(selectedPortal)}
          text='Continue'
        />
      </CtaFooter>
    </Layout>
  )
}

CollectReviews.propTypes = {
  handleBack: PropTypes.func,
}

export default CollectReviews
