import PropTypes, { oneOfType } from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Checkbox, PeopleTile as PeopleTileBase, Text, WambiPeopleTile } from '@components'
import { useLangContext } from '@contexts'
import { LANGUAGE_TYPE, numberFormatter, uId } from '@utils'

const PeopleTile = styled(PeopleTileBase)`
  margin: 0;
  padding-right: 20px;
`

const Row = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 17px 25px;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${colors.gray7}B3;
  }
`

const Title = styled(Text)`
  padding-left: 25px;
`

const Wrapper = styled.div`
  padding: 10px 0;
`

const setRecipientName = recipient => {
  if (recipient.isRealm) return `Everyone ${recipient.isLocation ? 'at' : 'under'} ${recipient.name}`
  return recipient.name
}

const PeopleSelection = ({
  className,
  getPeopleInGroups,
  groupSelect = false,
  handleSelect,
  list,
  multiSelect = false,
  selected,
  title,
}) => {
  const { getAccountLanguage } = useLangContext()

  return (
    <Wrapper className={className}>
      {list.length > 0 && (
        <>
          {title && <Title color='gray1'>{title}</Title>}
          {groupSelect ? (
            <Row id={uId('cpc-select-people-row')} onClick={() => handleSelect(list)}>
              <WambiPeopleTile
                border
                color='gray1'
                extraInfo={list.length === 1 ? list[0].groupName : ''}
                images={list.map(person => person.thumbnailImage)}
                subtitle={
                  list.length === 1
                    ? `${list[0].isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${
                        list[0].jobTitle ?? ''
                      }`
                    : ''
                }
                title={list.length === 1 ? list[0].name : ''}
              />
              {multiSelect && (
                <Checkbox
                  checked={selected && list.filter(person => selected.find(({ id }) => id === person.id)).length === list.length}
                  id={uId('cpc-select-people')}
                />
              )}
            </Row>
          ) : (
            list.map((recipient, i) => {
              const { groupName, isSelfRegistered, jobTitle, peopleCount, thumbnailImage, type } = recipient

              return (
                <Row id={uId('cpc-select-recipient-row')} key={i}>
                  <PeopleTile
                    extraInfo={
                      type === 'group' && peopleCount
                        ? `${numberFormatter(peopleCount)} ${peopleCount > 1 ? 'people' : 'person'}`
                        : groupName
                    }
                    peopleCount={peopleCount}
                    images={[thumbnailImage]}
                    onClick={() => {
                      if (handleSelect) handleSelect(recipient)
                      if (getPeopleInGroups && type === 'group') getPeopleInGroups(recipient)
                    }}
                    ratio='50px'
                    subtitle={
                      type === 'group' && peopleCount
                        ? groupName
                        : `${isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${jobTitle ?? ''}`
                    }
                    title={setRecipientName(recipient)}
                  />
                  {multiSelect && type !== 'group' && (
                    <Checkbox
                      checked={selected && selected.some(s => s.id === recipient.id)}
                      id={uId('cpc-select-recipient')}
                      onChange={() => handleSelect(recipient)}
                    />
                  )}
                </Row>
              )
            })
          )}
        </>
      )}
    </Wrapper>
  )
}

PeopleSelection.propTypes = {
  className: PropTypes.string,
  getPeopleInGroups: PropTypes.func,
  groupSelect: PropTypes.bool,
  handleSelect: PropTypes.func,
  list: PropTypes.array.isRequired,
  multiSelect: PropTypes.bool,
  selected: PropTypes.array,
  title: oneOfType([PropTypes.bool, PropTypes.string]),
}

export default PeopleSelection
