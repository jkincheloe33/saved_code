import styled from 'styled-components'

import { colors, EditIcon, multiplier, WambiWhiteBird } from '@assets'
import { FeatureWidget, Image, Text } from '@components'
import { useDraftContext, usePostContext } from '@contexts'

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

const Row = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
`

const WambiTrigger = () => {
  const { cpcDraftCount, setShowDraftsList } = useDraftContext()
  const { setShowSendCpc } = usePostContext()

  return (
    <FeatureWidget
      cta={{
        iconWidth: '25px',
        id: 'send-mail-icon',
        image: { alt: 'send mail icon', src: WambiWhiteBird },
        onClick: () => setShowSendCpc(true),
        ratio: '40px',
      }}
      drafts
      title='Send a Wambi'
    >
      {cpcDraftCount > 0 && (
        <EditRow>
          <Row
            onClick={() => {
              setShowDraftsList(true)
              setShowSendCpc(true)
            }}
          >
            <Icon alt='Edit Posts Icon' src={EditIcon} />
            <Text color='gray1' fontSize='18px'>
              Drafts ({cpcDraftCount})
            </Text>
          </Row>
        </EditRow>
      )}
    </FeatureWidget>
  )
}

export default WambiTrigger
