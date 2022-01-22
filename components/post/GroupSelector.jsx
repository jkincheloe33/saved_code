import styled from 'styled-components'
import PropTypes from 'prop-types'

import { CancelPurpleIcon, colors, PlusGrayIcon, WriteIcon } from '@assets'
import { InitialsBox, Paragraph, RoundButton, Text } from '@components'
import { uId } from '@utils'

const MAX_GROUP = 3

const GroupInfo = styled.div`
  display: flex;
  flex-grow: 1;
`

const GroupItem = styled.div`
  cursor: pointer;
  display: flex;
  padding-top: 20px;
`

const GroupItemStack = styled.div`
  background-color: ${colors.white};
  border-radius: 100px;
  border: 1px white solid;
  pointer-events: none;

  transform: translateX(-${p => p.index * 15}px);
  z-index: ${p => p.level};
`

const GroupStack = styled.div`
  display: flex;
  padding-right: 10px;
  padding-top: ${p => (p.groupLength === 1 ? '1px' : '14px')};
  width: ${p => `calc(${p.groupLength * 30}px + 20px)`};
`

const GroupText = styled(Text)`
  line-height: 38px;
  padding-left: 14px;
`

const GroupWrapper = styled.div`
  padding: 11px 0 31px 0;
`

const StackButton = styled(RoundButton)`
  margin-top: 12px;
  margin-left: auto;
`
const StackText = styled(Paragraph)`
  width: 150px;
  padding-top: 12px;
`

const StackWrapper = styled.div`
  cursor: pointer;
  display: flex;
`

const GroupSelector = ({ groups, selectedGroup, setOpenGroup, setSelectedGroup, stack = false }) => {
  const groupHandler = group => {
    if (groups.length === 1) return
    const { id } = group
    if (selectedGroup.some(g => g.id === id)) {
      setSelectedGroup(selectedGroup.filter(g => g.id !== id))
    } else {
      setSelectedGroup([...selectedGroup, group])
    }
  }

  return (
    <GroupWrapper>
      {!stack ? (
        groups.map(group => (
          <GroupItem key={uId('annoucement group')} onClick={() => groupHandler(group)}>
            <GroupInfo>
              <InitialsBox
                color={selectedGroup.some(g => g.id === group.id) ? null : 'gray5'}
                height='40px'
                initials={group.name[0]}
                radius='100px'
                width='40px'
              />
              <GroupText fontWeight='700' color={selectedGroup.some(g => g.id === group.id) ? 'gray1' : 'gray3'}>
                {group.name}
              </GroupText>
            </GroupInfo>

            {groups.length > 1 && (
              <RoundButton
                background={colors.gray8}
                iconWidth='11px'
                image={{ alt: 'group select icon', src: selectedGroup.some(g => g.id === group.id) ? CancelPurpleIcon : PlusGrayIcon }}
                ratio='30px'
              ></RoundButton>
            )}
          </GroupItem>
        ))
      ) : (
        <StackWrapper onClick={() => setOpenGroup(true)}>
          <GroupStack groupLength={selectedGroup.length < 3 ? selectedGroup.length : 3}>
            {selectedGroup.slice(0, MAX_GROUP).map((group, i) => (
              <GroupItemStack index={i} key={i} level={MAX_GROUP - i} stack>
                <InitialsBox height='40px' initials={group.name[0]} radius='100px' width='40px' />
              </GroupItemStack>
            ))}
          </GroupStack>
          <StackText maxLines={2}>{selectedGroup.map(({ name }) => name).join(', ')}</StackText>
          <StackButton
            background={colors.gray8}
            iconWidth='12px'
            image={{ alt: 'group select icon', src: WriteIcon }}
            ratio='30px'
          ></StackButton>
        </StackWrapper>
      )}
    </GroupWrapper>
  )
}

GroupSelector.propTypes = {
  groups: PropTypes.array,
  selectedGroup: PropTypes.array,
  setOpenGroup: PropTypes.func,
  setSelectedGroup: PropTypes.func,
  stack: PropTypes.bool,
}

export default GroupSelector
