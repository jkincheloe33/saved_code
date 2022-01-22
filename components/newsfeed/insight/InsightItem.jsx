import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useRouter } from 'next/router'

import { colors, PatientHeartIcon } from '@assets'
import { Avatar, Text } from '@components'
import { usePostContext, useUserContext } from '@contexts'
import { api } from '@services'
import { domRender } from '@utils/domRender'
import { INSIGHT_STATUS, INSIGHT_TYPE } from '@utils/types'

const ContentWrapper = styled.div`
  flex: 1;
  padding: 0 20px;
  width: 100%;
`

const ActionableContent = styled(Text)`
  display: inline;
`

const Content = styled(Text)`
  display: inline;
`

const Wrapper = styled.div`
  align-items: center;
  border-bottom: 0.25px solid ${colors.gray7};
  cursor: pointer;
  display: flex;
  min-height: 100px;
  padding: 20px;
  transition: background-color 500ms ease;

  :first-of-type {
    border-radius: 20px 20px 0px 0px;
  }

  :last-of-type {
    border: none;
  }
`

const InsightItem = ({ insight }) => {
  const { actionText, content, id, image, type, links } = insight

  const { setSelectedRecipient, setShowSendCpc, setSkipCpcSearch } = usePostContext()
  const { setInsightList } = useUserContext()
  const router = useRouter()

  const actionHandler = {
    [INSIGHT_TYPE.REVIEW_PROFILE]: () => router.push(`${router.pathname}?showReviewProfiles=true`),
    [INSIGHT_TYPE.SEND_SPECIFIC_CPC]: () => {
      const { tableKey: cpcTypeId } = links.find(({ tableName }) => tableName === 'cpcTypes')
      router.push(`${router.pathname}?sendCpc=true&cpcTypeId=${cpcTypeId}`)
    },
    [INSIGHT_TYPE.SEND_SPECIFIC_PEOPLE_CPC]: async () => {
      const { tableKey: personId } = links.find(({ tableName }) => tableName === 'people')
      const {
        data: { person, success },
      } = await api.post('/profile/getPersonById', { personId })

      if (success) {
        setSelectedRecipient(person)
        setShowSendCpc(true)
        setSkipCpcSearch(true)
      }
    },
    [INSIGHT_TYPE.SEND_ANNOUNCEMENT]: () => router.push(`${router.pathname}?sendPost=true`),
    [INSIGHT_TYPE.SEND_CPC]: () => router.push(`${router.pathname}?sendCpc=true`),
    [INSIGHT_TYPE.SHOW_FEEDBACK]: () => {
      const { tableKey: surveyId } = links.find(({ tableName }) => tableName === 'surveys')
      router.push(`${router.pathname}?surveyId=${surveyId}`)
    },
    [INSIGHT_TYPE.VIEW_SPECIFIC_LESSON]: () => {
      const { tableKey: lessonId } = links.find(({ tableName }) => tableName === 'lessons')
      router.push(`${router.pathname}?showLessons=true&lessonId=${lessonId}`)
    },
    [INSIGHT_TYPE.VIEW_LESSONS]: () => router.push(`${router.pathname}?showLessons=true`),
    [INSIGHT_TYPE.VIEW_RECENT_CPCS]: () => router.push({ pathname: '/wambis' }),
  }

  const addressInsight = async () => {
    const {
      data: { success },
    } = await api.post('/insights/update', { insightId: id, newStatus: INSIGHT_STATUS.ADDRESSED })
    if (success) {
      actionHandler[type] && (await actionHandler[type]())
      setInsightList(insight => insight.filter(i => i.id !== id))
    }
  }

  const getImage = () => {
    if (image) return image
    return PatientHeartIcon
  }

  return (
    <Wrapper onClick={() => addressInsight()}>
      <Avatar cover={Boolean(image)} image={getImage()} ratio='42px' shadow={!image} />
      <ContentWrapper>
        <Content color='gray1'>{domRender(content)}</Content>
        <ActionableContent color='blurple'>{actionText}</ActionableContent>
      </ContentWrapper>
    </Wrapper>
  )
}

InsightItem.propTypes = {
  insight: PropTypes.object.isRequired,
  setInsightList: PropTypes.func,
}

export default InsightItem
