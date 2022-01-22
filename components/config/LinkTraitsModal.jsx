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

const LinkTraitsModal = ({ isTraitsModalOpen, linkTrait, relatedTraits, setIsTraitsModalOpen, unlinkTrait }) => {
  const [isLinkingTrait, setIsLinkingTrait] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [traits, setTraits] = useState([])

  useEffect(() => {
    const getTraits = async () => {
      const {
        data: { success, traitsList },
      } = await api.post('/config/traits/listAll', { search: searchInput })

      if (success) setTraits(traitsList)
    }

    if (isTraitsModalOpen) getTraits()
  }, [isTraitsModalOpen, searchInput])

  // Prevents multiple endpoint calls before its finished...JC
  const runLinkTrait = async t => {
    setIsLinkingTrait(true)
    await linkTrait(t)
    setIsLinkingTrait(false)
  }

  return (
    <Modal
      onClickOut={() => {
        setIsTraitsModalOpen(false)
        setSearchInput('')
      }}
      open={isTraitsModalOpen}
    >
      <SearchWrapper>
        <SearchBar
          full
          handleClear={() => setSearchInput('')}
          onChange={e => setSearchInput(e.target.value)}
          placeholder='Search for a trait'
          value={searchInput}
        />
      </SearchWrapper>
      {traits.map(t => (
        <ItemRow key={t.id}>
          <div style={{ flexDirection: 'column' }}>
            {t.name} (ID: {t.id})<div style={{ fontSize: '14px' }}>{t.traitTypeName}</div>
          </div>
          {!relatedTraits.some(rt => rt.traitId === t.id) && <button onClick={() => !isLinkingTrait && runLinkTrait(t)}>Link</button>}
          {unlinkTrait && relatedTraits?.some(rt => rt.traitId === t.id) && (
            <button onClick={() => unlinkTrait(relatedTraits?.filter(rt => rt.traitId === t.id)[0].id)}>Unlink</button>
          )}
        </ItemRow>
      ))}
    </Modal>
  )
}

LinkTraitsModal.propTypes = {
  isTraitsModalOpen: PropTypes.bool,
  linkTrait: PropTypes.func,
  relatedTraits: PropTypes.array,
  setIsTraitsModalOpen: PropTypes.func,
  unlinkTrait: PropTypes.func,
}

export default LinkTraitsModal
