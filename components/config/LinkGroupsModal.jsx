import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Modal, SearchBar } from '@components'
import { api } from '@services'

const ItemRow = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.gray8};
  display: flex;
  font-size: 20px;
  justify-content: space-between;
  padding: 20px;

  button {
    height: 30px;
    margin: auto 0;
  }
`

const SearchWrapper = styled.div`
  background: ${colors.white};
  padding: 20px 0;
`

const LinkGroupsModal = ({ isGroupsModalOpen, linkGroup, parentGroups, relatedGroups, setIsGroupsModalOpen, unlinkGroup }) => {
  const [isLinkingGroup, setIsLinkingGroup] = useState(false)
  const [groups, setGroups] = useState([])
  const [search, setSearchInput] = useState('')

  useEffect(() => {
    const getGroups = async () => {
      const {
        data: { groupsForAccount, success },
      } = await api.post('/config/groups/list', { search })

      if (success) setGroups(groupsForAccount)
    }

    const getChildGroups = async () => {
      const {
        data: { childGroups, success },
      } = await api.post('/config/groups/getAllChildren', { parentIds: parentGroups.map(rg => rg.groupId), search })

      if (success) setGroups(childGroups)
    }

    if (isGroupsModalOpen) {
      if (parentGroups?.length) getChildGroups()
      else getGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGroupsModalOpen, parentGroups, relatedGroups, search])

  // Prevents multiple endpoint calls before its finished...JC
  const runLinkGroup = async g => {
    setIsLinkingGroup(true)
    await linkGroup(g)
    setIsLinkingGroup(false)
  }

  return (
    <Modal
      onClickOut={() => {
        setIsGroupsModalOpen(false)
        setSearchInput('')
      }}
      open={isGroupsModalOpen}
    >
      <SearchWrapper>
        <SearchBar
          full
          handleClear={() => setSearchInput('')}
          onChange={e => setSearchInput(e.target.value)}
          placeholder='Search for a group'
          value={search}
        />
      </SearchWrapper>
      {groups.map(g => (
        <ItemRow key={g.id}>
          <div style={{ flexDirection: 'column' }}>
            {g.name} (ID: {g.id})<div style={{ fontSize: '14px' }}>{g.groupTypeName}</div>
          </div>
          {!relatedGroups?.some(rg => rg.groupId === g.id) && <button onClick={() => !isLinkingGroup && runLinkGroup(g)}>Link</button>}
          {unlinkGroup && relatedGroups?.some(rg => rg.groupId === g.id) && (
            <button onClick={() => unlinkGroup(relatedGroups?.filter(rg => rg.groupId === g.id)[0].id)}>Unlink</button>
          )}
        </ItemRow>
      ))}
    </Modal>
  )
}

LinkGroupsModal.propTypes = {
  isGroupsModalOpen: PropTypes.bool,
  linkGroup: PropTypes.func,
  parentGroups: PropTypes.array,
  relatedGroups: PropTypes.array,
  setIsGroupsModalOpen: PropTypes.func,
  unlinkGroup: PropTypes.func,
}

export default LinkGroupsModal
