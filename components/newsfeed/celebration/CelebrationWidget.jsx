import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { PartyHatIcon } from '@assets'
import { CelebrationItem, FeatureWidget, Image, Text, ViewAllCelebrations } from '@components'
import { coreApi } from '@services'

const ContentCard = styled.div`
  display: flex;
  flex-direction: ${p => (p.column ? 'column' : 'row')};

  ${Text} {
    flex: 1;
    margin: auto;
  }
`

const PartyHatImage = styled(Image)`
  margin: auto 25px auto 0;
`

const CelebrationWidget = ({ setSeeMoreCelebrations, setShowSeeMoreCelebrations, showSeeMore }) => {
  const [celebrationList, setCelebrationsList] = useState(null)

  useEffect(() => {
    const getCelebrations = async () => {
      const {
        data: { newCelebrations, success },
      } = await coreApi.post('/newsfeed/celebrations/list', { clientTzOffset: new Date().getTimezoneOffset(), pageLimit: 5 })

      if (success) setCelebrationsList(newCelebrations)
      else setCelebrationsList([])
    }

    getCelebrations()
  }, [])

  return (
    <FeatureWidget
      title='Celebrations'
      viewAll={
        celebrationList?.length
          ? {
              id: 'view-all-celebrations-btn',
              onClick: () => {
                setSeeMoreCelebrations({
                  component: ViewAllCelebrations,
                  props: { handleBack: () => setShowSeeMoreCelebrations(false), open: !showSeeMore },
                })
                setShowSeeMoreCelebrations(true)
              },
            }
          : null
      }
    >
      <ContentCard column={celebrationList?.length > 0}>
        {celebrationList?.length > 0 && <CelebrationItem celebrationList={celebrationList}></CelebrationItem>}
        {celebrationList?.length === 0 && (
          <>
            <PartyHatImage alt='party hat icon' src={PartyHatIcon} width='40px' />
            <Text noClamp>No upcoming birthdays or work anniversaries in your group(s)</Text>
          </>
        )}
      </ContentCard>
    </FeatureWidget>
  )
}

CelebrationWidget.propTypes = {
  celebrationList: PropTypes.array,
  setSeeMoreCelebrations: PropTypes.func,
  setShowSeeMoreCelebrations: PropTypes.func,
  showSeeMore: PropTypes.func,
}

export default CelebrationWidget
