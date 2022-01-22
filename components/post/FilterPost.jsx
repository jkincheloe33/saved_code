import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Checkbox, CtaFooter, DynamicContainer, Layout, PillButton, Text } from '@components'
import { api } from '@services'
import { uId } from '@utils'

const TraitItem = styled.div`
  display: flex;
  padding-top: 22px;
`

const TraitPeopleCount = styled(Text)`
  margin-left: 5px;
`

const TraitText = styled(Text)`
  padding-left: 11px;
`

const Wrapper = styled(DynamicContainer)`
  padding: 28px 22px 150px;
`

const FilterPost = ({ cta, handleBack, groups, selectedTraits, setSelectedTraits, setTraitsText }) => {
  const [traits, setTraits] = useState([])

  const allTraitsChecked = traits.length === selectedTraits.length

  useEffect(() => {
    const getTraits = async () => {
      const {
        data: { success, traitData },
      } = await api.post('/manager/getTraitsInMyGroup', { groups: groups.map(({ id }) => id) })
      if (success) setTraits(traitData)
      if (selectedTraits.length === 0) setSelectedTraits(traitData)
    }
    getTraits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectTraitHandler = trait => {
    if (trait === null) {
      return selectedTraits.length < traits.length ? setSelectedTraits(traits) : setSelectedTraits([])
    }

    if (selectedTraits.some(t => t.id === trait.id)) {
      setSelectedTraits(selectedTraits.filter(t => t.id !== trait.id))
    } else {
      setSelectedTraits([...selectedTraits, trait])
    }
  }

  const saveTraits = async () => {
    setSelectedTraits(selectedTraits)
    if (allTraitsChecked) setTraitsText('Everyone')
    else {
      setTraitsText(
        selectedTraits
          .map(({ name }) => name)
          .splice(0, 2)
          .join(', ')
      )
    }

    handleBack()
  }

  return (
    <Layout cta={cta} handleBack={handleBack} id='trait-filter' inner noFooter title='Create a Post'>
      <Wrapper>
        <Text>Filter</Text>
        <TraitItem>
          <Checkbox checked={allTraitsChecked} onChange={() => selectTraitHandler(null)} />
          <TraitText fontWeight='600' color='gray1'>
            {selectedTraits.length < traits.length ? 'Select All' : 'Deselect All'}
          </TraitText>
          <TraitPeopleCount fontWeight='600'>({traits.reduce((acc, { peopleCount }) => acc + peopleCount, 0)})</TraitPeopleCount>
        </TraitItem>

        {traits.map(trait => {
          const checked = selectedTraits.some(t => t.id === trait.id)
          return (
            <TraitItem key={uId('post-Trait')}>
              <Checkbox onChange={() => selectTraitHandler(trait)} checked={checked} />
              <TraitText color='gray1'>{trait.name}</TraitText>
              {checked && <TraitPeopleCount>({trait.peopleCount})</TraitPeopleCount>}
            </TraitItem>
          )
        })}
      </Wrapper>
      <CtaFooter>
        <PillButton
          disabled={selectedTraits.length === 0}
          full
          id='announcement-select-people-btn'
          onClick={() => saveTraits()}
          text='Apply'
        />
      </CtaFooter>
    </Layout>
  )
}

FilterPost.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func,
  groups: PropTypes.array,
  selectedTraits: PropTypes.array,
  setSelectedTraits: PropTypes.func,
  setTraitsText: PropTypes.func,
}

export default FilterPost
