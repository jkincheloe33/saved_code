import PropTypes from 'prop-types'
import styled from 'styled-components'
import numbro from 'numbro'

import { colors } from '@assets'
import { PeopleTile as PeopleTileBase, Title } from '@components'
import { useAuthContext, useProfileContext } from '@contexts'

const CelebrationTitle = styled(Title)`
  color: ${colors.gray3};
  font-size: 16px;
  font-weight: 500;
  justify-content: left;
`

const PeopleTile = styled(PeopleTileBase)`
  margin: 0;
  padding: 12px 0;
`

const Row = styled.div`
  cursor: pointer;
`

const SECTIONS = {
  today: {
    celebrationFilter: dateDiff => dateDiff === 0,
    name: 'Today',
  },
  recent: {
    celebrationFilter: dateDiff => dateDiff < 0,
    name: 'Recent',
  },
  upcoming: {
    celebrationFilter: dateDiff => dateDiff > 0,
    name: 'Coming up',
  },
}

const CelebrationItem = ({ celebrationList, handleBack }) => {
  const { clientAccount } = useAuthContext()
  const { setSelectedProfileId, setShowProfile } = useProfileContext()

  const getCelebrations = Object.values(SECTIONS)
    .map(({ name, celebrationFilter }) => {
      if (celebrationList.length > 0)
        return {
          name,
          data: celebrationList.filter(({ daysLater }) => celebrationFilter(daysLater)),
        }
    })
    .filter(celebration => celebration && celebration.data.length)

  const createSubtitle = (date, type, yearsAgo) => {
    // If yearsAgo is 0, they were hired in the last week..KA
    if (yearsAgo === 0) {
      return type === SECTIONS.today.name ? `👋 Welcome to ${clientAccount?.name}` : `👋 ${date} - Welcome to ${clientAccount?.name}`
    }
    // If yearsAgo is provided, its an anniversary celebration...JC
    else if (yearsAgo > 0) {
      const prefix = numbro(yearsAgo).format({ output: 'ordinal' })
      return type === SECTIONS.today.name ? `🎉 ${prefix} anniversary` : `🎉 ${date} - ${prefix} anniversary`
    }
    // Else its a birthday celebration...JC
    else {
      return type === SECTIONS.today.name ? '🎂 Happy Birthday!' : `🎂 ${date} - Happy Birthday!`
    }
  }

  const handleSelectProfile = id => {
    if (id) {
      setShowProfile(true)
      setSelectedProfileId(id)
      if (handleBack) handleBack()
    }
  }

  const renderCelebrations = (celebration, i, type) => {
    const { date, groupName, id, image, name, yearsAgo } = celebration

    return (
      <div id={`celebration-item-${i}`} key={i}>
        <PeopleTile
          extraInfo={createSubtitle(date, type, yearsAgo)}
          images={[image]}
          onClick={() => handleSelectProfile(id)}
          personId={id}
          ratio='50px'
          subtitle={groupName}
          title={name}
        />
      </div>
    )
  }

  return (
    <>
      {celebrationList.length > 0 &&
        getCelebrations.map(({ data, name }, i) => (
          <Row key={i}>
            <CelebrationTitle key={i}>{name}</CelebrationTitle>
            {data.map((celebration, j) => renderCelebrations(celebration, j, name))}
          </Row>
        ))}
    </>
  )
}

CelebrationItem.propTypes = {
  celebrationList: PropTypes.array,
  handleBack: PropTypes.func,
}

export default CelebrationItem
