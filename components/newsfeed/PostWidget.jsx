import { useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, EditIcon, MegaphoneIcon, multiplier } from '@assets'
import { Avatar as AvatarBase, FeatureWidget, Image, RoundButton, Text } from '@components'
import { useDraftContext, usePostContext, useUserContext } from '@contexts'

const Avatar = styled(AvatarBase)`
  pointer-events: none;
`

const Card = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: ${multiplier}px ${multiplier * 2}px ${multiplier * 2}px;

  @media (${devices.largeDesktop}) {
    padding: ${multiplier}px ${multiplier * 3}px ${multiplier * 3}px;
  }
`

const EditRow = styled.div`
  align-items: center;
  border-top: 0.5px solid ${colors.gray8};
  display: flex;
  justify-content: center;
  padding-top: ${multiplier * 3}px;
`

const Icon = styled(Image)`
  margin-right: ${multiplier}px;
  width: 16px;
`

const Input = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  border-radius: 20px;
  display: flex;
  flex: 1;
  justify-content: space-between;
  margin-left: ${multiplier / 2}px;
  padding: ${multiplier / 2}px ${multiplier / 2}px ${multiplier / 2}px ${multiplier * 2}px;
  position: relative;
`

const Row = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
`

const Wrapper = styled(FeatureWidget)`
  ${p => p.isFeedItem && 'margin-bottom: 0;'}
`

const PostWidget = ({ isFeedItem = false, updateSize }) => {
  const { setShowPostWorkflow } = usePostContext()
  const { postDraftCount, setShowDraftsList } = useDraftContext()
  const { user: { thumbnailImage } } = useUserContext() // prettier-ignore

  // need to update the PostWidget size on mobile for newsfeed virtualization...JK
  useEffect(() => {
    if (updateSize) updateSize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postDraftCount])

  return (
    <Wrapper drafts hideTitleMobile isFeedItem={isFeedItem} title='Create a Post'>
      <Card onClick={() => setShowPostWorkflow(true)}>
        <Avatar image={thumbnailImage} ratio='40px' />
        <Input>
          <Text>Write a post here...</Text>
          <RoundButton id='megaphone-icon' image={{ alt: 'megaphone icon', src: MegaphoneIcon }} ratio='32px' shadow />
        </Input>
      </Card>
      {postDraftCount > 0 && (
        <EditRow>
          <Row
            onClick={() => {
              setShowDraftsList(true)
              setShowPostWorkflow(true)
            }}
          >
            <Icon alt='Edit Posts Icon' src={EditIcon} />
            <Text color='gray1' fontSize='18px'>
              Drafts ({postDraftCount})
            </Text>
          </Row>
        </EditRow>
      )}
    </Wrapper>
  )
}

PostWidget.propTypes = {
  isFeedItem: PropTypes.bool,
  updateSize: PropTypes.func,
}

export default PostWidget
