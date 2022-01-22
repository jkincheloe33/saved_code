import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, CloseIcon as Icon, EditRecipientIcon } from '@assets'
import { Image } from '@components'

const CloseIcon = styled(Icon)`
  // fix for close icon width in safari...PS
  width: auto;
`

const CloseIconWrapper = styled.div`
  cursor: pointer;
  height: 15px;
  margin-left: 5px;
`

const Edit = styled(Image)`
  cursor: pointer;
  margin-left: 10px;
`

const Recipient = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  border-radius: 40px;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  margin: 0 5px 15px;
  padding: 5px 10px;
  width: auto;
`

const RecipientsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`

const Wrapper = styled.div`
  border: 1px solid ${colors.gray7};
  border-radius: 15px;
  display: flex;
  flex-wrap: wrap;
  height: auto;
  max-height: 122px;
  overflow: auto;
  padding: 15px 10px 0;
`

const SelectedRecipients = ({ cpcScreens, groups, recipients, removeRecipient, setActive, setGroupSelected }) => {
  return (
    <Wrapper>
      <RecipientsWrapper>
        {groups?.map((group, i) => (
          <Recipient
            key={i}
            onClick={() => {
              setGroupSelected(group)
              setActive(cpcScreens.GROUP_RECIPIENTS)
            }}
          >
            {group.isRealm ? `Everyone ${group.isLocation ? 'at' : 'under'} ${group.name}` : group.name}
            <Edit src={EditRecipientIcon} />
          </Recipient>
        ))}
      </RecipientsWrapper>
      <RecipientsWrapper>
        {recipients?.map(person => (
          <Recipient key={person.id} onClick={() => removeRecipient(person.id)}>
            {person.name}
            <CloseIconWrapper>
              <CloseIcon color={colors.gray1} />
            </CloseIconWrapper>
          </Recipient>
        ))}
      </RecipientsWrapper>
    </Wrapper>
  )
}

SelectedRecipients.propTypes = {
  cpcScreens: PropTypes.object,
  groups: PropTypes.array,
  recipients: PropTypes.array,
  removeRecipient: PropTypes.func,
  setActive: PropTypes.func,
  setGroupSelected: PropTypes.func,
}

export default SelectedRecipients
