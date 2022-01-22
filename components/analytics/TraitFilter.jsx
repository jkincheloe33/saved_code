import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { DisciplineIcon } from '@assets'
import { Checkbox, Dropdown, DropdownButton, PillButton, SearchBar, Text } from '@components'
import { api } from '@services'
import { handleClickOut, removeDuplicates, useCallbackDelay } from '@utils'

const FooterPill = styled(PillButton)`
  margin-top: 20px;
`

const NoResultsText = styled(Text)`
  margin-top: 20px;
  text-align: center;
`

const SearchWrapper = styled.div`
  height: 37px;
  margin-bottom: 20px;

  > div {
    width: 100%;
  }
`

const TraitSelect = styled.div`
  flex: 1;
  overflow: auto;
  padding-bottom: 10px;
`

const TraitSelectRow = styled.div`
  display: flex;
  margin-top: 20px;
`

const TraitText = styled(Text)`
  cursor: pointer;
`

const Wrapper = styled.div`
  display: ${p => p.noTraits && 'none'};
  margin: auto 0;
  position: relative;
  width: fit-content;
  z-index: 4;
`

const TraitFilter = ({ dashboard, filterLoadingState, filterTraits, index, setFilterLoadingState, setFilterTraits }) => {
  const ref = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState([])
  const [traits, setTraits] = useState([])

  useEffect(() => {
    setLoading(true)
    const getTraits = async () => {
      const {
        data: { success, traitsForType },
      } = await api.post('/analytics/getFilterTraits', {
        dashboardId: dashboard.id,
        search: searchTerm.length > 2 ? searchTerm : '',
        traitTypeId: dashboard.filterTraitTypeId,
      })

      if (success) {
        setTraits(traitsForType)
        setFilterTraits(traitsForType)
        setSelected(traitsForType)
        setLoading(false)
        // set its loading state to true. this prevents the widgets from running before this finishes...JK
        setFilterLoadingState(wls => ({ ...wls, [index]: true }))
      }
    }

    if (dashboard?.id && dashboard?.filterTraitTypeId) getTraits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard])

  // will set its loading state to true if there's no filterTraitTypeId and if its loading state is currently false...JK
  useEffect(() => {
    if (dashboard && !dashboard.filterTraitTypeId && setFilterLoadingState && !filterLoadingState[index]) {
      setFilterLoadingState(wls => ({ ...wls, [index]: true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLoadingState, filterTraits])

  handleClickOut(ref, () => {
    setIsOpen(false)
    setSearchTerm('')
  })

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    getSearchTraits()
  }, [searchTerm])

  const getSearchTraits = async () => {
    const {
      data: { success, traitsForType },
    } = await api.post('/analytics/getFilterTraits', {
      dashboardId: dashboard.id,
      search: searchTerm.length > 2 ? searchTerm : '',
      traitTypeId: dashboard.filterTraitTypeId,
    })

    if (success) setTraits(traitsForType)
  }

  const handleApplyFilter = () => {
    setFilterTraits(selected)
    setIsOpen(false)
  }

  const handleTraitSelection = traits => {
    const exists = traits.every(t => selected?.some(st => st.id === t.id))

    if (exists) {
      // if all traits exist, removes all...KA
      setSelected(st => st.filter(s => !traits.some(t => s.id === t.id)))
    } else {
      // if not all traits exist, it adds them all again and removes duplicates...KA
      setSelected(st => removeDuplicates([...st, ...traits]))
    }
  }

  // needed to conditionally render to allow the useEffect to fire and set its loading state to true if this filter is hidden...JK
  return (
    <>
      {dashboard?.filterTraitTypeId ? (
        <Wrapper noTraits={filterTraits.length === 0 || loading} ref={ref}>
          <DropdownButton
            active={isOpen}
            displayText={dashboard.traitTypeName}
            icon={DisciplineIcon}
            onClick={() => setIsOpen(o => !o)}
            spacing='0 10px'
          />
          <Dropdown open={isOpen} small>
            <SearchWrapper>
              <SearchBar
                full
                handleClear={() => setSearchTerm('')}
                id='trait-filter-search'
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={`Search by ${dashboard.traitTypeName.toLowerCase()}`}
                value={searchTerm}
              />
            </SearchWrapper>
            <TraitSelect>
              {traits.length > 0 && (
                <>
                  <TraitSelectRow>
                    <Checkbox
                      checked={traits.every(cg => selected.some(sg => sg.id === cg.id))}
                      id='select-all-traits-checkbox'
                      onChange={() => handleTraitSelection(traits)}
                      spacing='0 12px 0 0'
                    />
                    <TraitText color='gray1' onClick={() => handleTraitSelection(traits)}>
                      Select All
                    </TraitText>
                  </TraitSelectRow>
                  {traits.map(t => (
                    <TraitSelectRow key={t.id}>
                      <Checkbox
                        checked={selected.some(s => s.id === t.id)}
                        id={`trait-checkbox-${t.id}`}
                        onChange={() => handleTraitSelection([t])}
                        spacing='0 12px 0 0'
                      />
                      <TraitText color='gray1' id={`trait-text-${t.id}`} onClick={() => handleTraitSelection([t])}>
                        {t.name}
                      </TraitText>
                    </TraitSelectRow>
                  ))}
                </>
              )}
              {!traits.length && searchTerm.length > 2 && <NoResultsText>No traits found.</NoResultsText>}
            </TraitSelect>
            <FooterPill disabled={!selected.length} full id='trait-filter-apply-btn' onClick={handleApplyFilter} text='Apply' thin />
          </Dropdown>
        </Wrapper>
      ) : null}
    </>
  )
}

TraitFilter.propTypes = {
  dashboard: PropTypes.object,
  filterLoadingState: PropTypes.object,
  filterTraits: PropTypes.array,
  index: PropTypes.number,
  setFilterLoadingState: PropTypes.func,
  setFilterTraits: PropTypes.func,
}

export default TraitFilter
