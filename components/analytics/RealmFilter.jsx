import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { devices, LocationIcon } from '@assets'
import { Checkbox, Dropdown, DropdownButton, PillButton, SearchBar, Text } from '@components'
import { api } from '@services'
import { handleClickOut, removeDuplicates, useCallbackDelay } from '@utils'

const TIMING = 250

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 20px;

  @media (${devices.tablet}) {
    flex-direction: row;
  }
`

const FooterPill = styled(PillButton)`
  width: 100%;

  &:last-of-type {
    margin-top: 20px;
  }

  @media (${devices.tablet}) {
    width: 48%;

    &:last-of-type {
      margin-top: 0;
    }
  }
`

const GroupSelect = styled.div`
  flex: 1;
  overflow: auto;
  padding-bottom: 30px;
`

const GroupSelectAllText = styled(Text)`
  cursor: pointer;
`

const GroupSelectRow = styled.div`
  display: flex;
  margin-top: 20px;
`

const GroupSelectText = styled(Text)`
  cursor: pointer;
  display: block;
  pointer-events: ${p => (p.clickable ? 'auto' : 'none')};

  @media (${devices.tablet}) {
    display: flex;
  }
`

const GroupTree = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 30px 0 10px;
`

const GroupTreeCarat = styled(Text)`
  margin: auto 15px;
`

const GroupTreeItem = styled.div`
  display: flex;

  ${Text}:first-child {
    cursor: pointer;
  }

  ${Text}:last-of-type {
    cursor: auto;
  }
`

const NoResultsText = styled(Text)`
  margin-top: 20px;
  text-align: center;
`

const SearchWrapper = styled.div`
  height: 37px;

  > div {
    width: 100%;
  }
`

const Wrapper = styled.div`
  position: relative;
  width: fit-content;
  // needs to be 6 on small screens to sit over top of the CtaFooter in the DraftPost component...JK
  z-index: 6;

  // lower the z-index when not open so that this filter isn't visible through the sidebar modals...JK
  @media (${devices.tablet}) {
    z-index: ${p => (p.open ? 6 : 4)};
  }

  ${p => p.hidden && 'display: none;'}
`

const RealmFilter = ({
  activeTab,
  filterGroups,
  filterLoadingState,
  full = false,
  index,
  savedGroups,
  setFilterGroups,
  setFilterLoadingState,
  setShowOverlay = () => {},
}) => {
  const ref = useRef(null)

  const [childGroups, setChildGroups] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [parentGroups, setParentGroups] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState([])

  const oneGroupNoChild = childGroups.length === 1 && !childGroups[0].childCount && !parentGroups.length

  handleClickOut(ref, () => {
    setIsOpen(false)
    setShowOverlay(false)
  })

  const handleFilterLabel = groups =>
    groups?.length > 0 && `${groups[0].name}${groups.length > 1 ? ` + ${groups.length - 1} other${groups.length > 2 ? 's' : ''}` : ''}`

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    getGroups()
  }, [parentGroups, searchTerm])

  // will set its loading state if filterGroups has length or if we are hiding the groupFilter and its loading state is currently false...JK
  useEffect(() => {
    if ((filterGroups?.length || activeTab?.groupFilterHidden) && setFilterLoadingState && !filterLoadingState[index]) {
      setFilterLoadingState(wls => ({ ...wls, [index]: true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGroups, filterLoadingState])

  // reset state on activeTab change...JK
  useEffect(() => {
    // handleCancel()
    if (activeTab?.groupFilterHidden) handleCancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const getGroups = async () => {
    const {
      data: { childGroups, success },
    } = await api.post('/analytics/getFilterGroups', {
      parentGroup: parentGroups[parentGroups.length - 1] || null,
      search: searchTerm.length > 2 ? searchTerm : '',
    })

    if (success) {
      setChildGroups(childGroups)
      if (!parentGroups.length && !selected.length && !searchTerm) {
        setSelected(childGroups)
        setFilterGroups(childGroups)
      }
    }
  }

  const handleApplyFilter = () => {
    setFilterGroups(selected)
    setIsOpen(false)
    setShowOverlay(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
    setShowOverlay(false)
    setTimeout(() => {
      setSearchTerm('')
      setSelected([])
      setParentGroups([])
    }, TIMING)
  }

  const handleGroupSelection = groups => {
    // checks if every group is already selected...KA
    const exists = groups.every(g => selected?.some(sg => sg.id === g.id))

    // After you select a group, clear all children and parents...KA
    setSelected(sg => sg.filter(s => childGroups.some(cg => cg.id === s.id)))

    if (exists) {
      // if all groups exist, removes all...KA
      setSelected(sg => sg.filter(s => !groups.some(g => s.id === g.id)))
    } else {
      // if not all groups exist, it adds them all again and removes duplicates...KA
      setSelected(sg => removeDuplicates([...sg, ...groups]))
    }
  }

  useEffect(() => {
    setSearchTerm('')
  }, [parentGroups])

  useEffect(() => {
    if (savedGroups) setSelected(savedGroups)
  }, [savedGroups])

  return (
    <Wrapper hidden={activeTab?.groupFilterHidden} open={isOpen} ref={ref}>
      <DropdownButton
        active={isOpen}
        disabled={oneGroupNoChild}
        displayText={
          savedGroups?.length === filterGroups?.length && savedGroups?.every(sg => filterGroups?.some(fg => fg.id === sg.id))
            ? handleFilterLabel(savedGroups)
            : handleFilterLabel(filterGroups)
        }
        icon={LocationIcon}
        id='realm-filter-trigger'
        onClick={() => {
          setIsOpen(o => !o)
          setShowOverlay(showOverlay => !showOverlay)
        }}
        spacing='0 10px 0 0'
      />
      <Dropdown full={full} open={isOpen}>
        <SearchWrapper>
          <SearchBar
            full
            handleClear={() => setSearchTerm('')}
            id='realm-filter-search'
            onChange={e => setSearchTerm(e.target.value)}
            placeholder='Search for a group'
            value={searchTerm}
          />
        </SearchWrapper>
        <GroupTree>
          <GroupTreeItem>
            <Text color='blurple' fontWeight={600} id='group-tree-my-groups' onClick={() => setParentGroups([])}>
              My Groups
            </Text>
            {parentGroups.length > 0 && <GroupTreeCarat color='blurple'>{'>'}</GroupTreeCarat>}
          </GroupTreeItem>
          {parentGroups.length > 0 &&
            parentGroups.map(({ name }, i) => (
              <GroupTreeItem key={i}>
                <Text
                  color='blurple'
                  fontWeight={600}
                  id={`group-tree-item-${i}`}
                  onClick={() => setParentGroups(pg => pg.slice(0, i + 1))}
                >
                  {name}
                </Text>
                {i !== parentGroups.length - 1 && <GroupTreeCarat color='blurple'>{'>'}</GroupTreeCarat>}
              </GroupTreeItem>
            ))}
        </GroupTree>
        <GroupSelect>
          {childGroups.length > 0 && (
            <>
              <GroupSelectRow>
                <Checkbox
                  checked={childGroups.every(cg => selected.some(sg => sg.id === cg.id))}
                  id='select-all-groups-checkbox'
                  onChange={() => handleGroupSelection(childGroups)}
                  spacing='0 12px 0 0'
                />
                <GroupSelectAllText color='gray1' fontWeight={700} onClick={() => handleGroupSelection(childGroups)}>
                  Select All
                </GroupSelectAllText>
              </GroupSelectRow>
              {childGroups.map(g => (
                <GroupSelectRow key={g.id}>
                  <Checkbox
                    checked={selected.some(sg => sg.id === g.id)}
                    id={`group-checkbox-${g.id}`}
                    onChange={() => handleGroupSelection([g])}
                    spacing='0 12px 0 0'
                  />
                  <GroupSelectText
                    clickable={g.childCount > 0}
                    color='gray1'
                    fontWeight={700}
                    id={`group-text-${g.id}`}
                    onClick={() => setParentGroups(pg => [...pg, g])}
                  >
                    {g.name}
                    {g.childCount > 0 && (
                      <Text color='blurple' id={`group-row-children-text-${g.id}`}>
                        &nbsp; + {g.childCount} {g.childCount === 1 ? 'subgroup' : 'subgroups'}
                      </Text>
                    )}
                  </GroupSelectText>
                </GroupSelectRow>
              ))}
            </>
          )}
          {!childGroups.length && searchTerm.length > 2 && <NoResultsText>No groups found.</NoResultsText>}
        </GroupSelect>
        <ButtonsWrapper>
          <FooterPill id='realm-filter-cancel-btn' inverted onClick={handleCancel} text='Reset' thin />
          <FooterPill disabled={!selected.length} id='realm-filter-apply-btn' onClick={handleApplyFilter} text='Apply' thin />
        </ButtonsWrapper>
      </Dropdown>
    </Wrapper>
  )
}

RealmFilter.propTypes = {
  activeTab: PropTypes.object,
  filterGroups: PropTypes.array,
  filterLoadingState: PropTypes.object,
  full: PropTypes.bool,
  index: PropTypes.number,
  savedGroups: PropTypes.array,
  setFilterGroups: PropTypes.func.isRequired,
  setFilterLoadingState: PropTypes.func,
  setShowOverlay: PropTypes.func,
}

export default RealmFilter
