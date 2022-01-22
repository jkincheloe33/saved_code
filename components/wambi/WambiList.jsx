import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { colors } from '@assets'
import { Card, DynamicContainer, Layout, Loader, TabBar, Title, WambiItem as WambiItemBase } from '@components'
import { useCelebrationContext } from '@contexts'
import { coreApi } from '@services'
import { NEWSFEED_VIEW } from '@utils'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const ListItemWrapper = styled(Card)`
  flex: 0 1 auto;
  height: 100%;
  margin: 20px auto 10px auto;
  width: 90%;
`

const NoResultsText = styled(Title)`
  margin-top: 50px;
`

const TabBarWrapper = styled.div`
  margin-top: 20px;
`

const VariableList = styled(VariableSizeList)`
  padding-bottom: 140px;
  scroll-behavior: smooth;
  scrollbar-color: ${colors.gray3}99;

  &::-webkit-scrollbar {
    display: block;
    width: 6px;
    -webkit-appearance: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.gray3}99;
    border-radius: 5px;
  }
`

const WambiItem = styled(WambiItemBase)`
  background-color: ${colors.white};
`

const TABS = [
  {
    id: 'cpc-received-tab',
    name: 'Received',
  },
  {
    id: 'cpc-sent-tab',
    name: 'Sent',
  },
]

// Wambi types...PS
const wambiTypes = ['received', 'sent']

const WambiList = ({ handleBack, person, profile, setActive, setSeeMoreCPCs, ...props }) => {
  const [cpcs, setCPCs] = useState([])
  const [currentTab, setCurrentTab] = useState(0)
  const [fetchedInitialList, setFetchedInitialList] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [loadMore, setLoadMore] = useState(true)
  const [page, setPage] = useState(0)

  const { setCelebration } = useCelebrationContext()

  //Refs
  const itemSize = useMemo(() => () => {}, [])
  const infiniteRef = useRef(null)
  const listRef = useRef(null)
  const isItemLoaded = index => !loadMore || index < cpcs.length

  const ref = useRef()
  const selectedProfile = person != null ? person : profile

  // Call on mount/tab change...JC
  useEffect(() => {
    const request = selectedProfile.type === 'group' ? '/profile/getGroupWambiList' : '/profile/getWambiList'
    setIsLoading(true)
    const getCPCs = async () => {
      const {
        data: { completedChallenges, cpc, rewardProgress, success },
      } = await coreApi.post(request, {
        fetchedInitialList,
        type: wambiTypes[currentTab],
        userId: selectedProfile.id,
        groupId: selectedProfile.id,
      })
      if (success) {
        if (fetchedInitialList) setFetchedInitialList(false)
        ref.current.scrollTo(0, 0)
        setCelebration({ completeChallenges: completedChallenges, rewardProgress })
        setLoadMore(cpc.length)
        setCPCs(cpc)
        setPage(1)
      } else {
        setLoadMore(false)
      }

      setIsLoading(false)
    }

    getCPCs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, person, selectedProfile])

  // Call when scrolling for more CPCs..PS
  const getMore = async () => {
    const request = selectedProfile.type === 'group' ? '/profile/getGroupWambiList' : '/profile/getWambiList'
    const {
      data: { cpc: newCPCs, success },
    } = await coreApi.post(request, { type: wambiTypes[currentTab], userId: selectedProfile.id, groupId: selectedProfile.id, page })
    if (success) {
      if (newCPCs.length) {
        setPage(page + 1)
        setCPCs([...cpcs, ...newCPCs])
      } else {
        setLoadMore(false)
      }
    }
  }

  const getContent = index => {
    const content = !isItemLoaded(index) ? (
      <Loader />
    ) : (
      <WambiItem
        {...props}
        cta={{
          onClick: () => {
            handleBack()
            setTimeout(() => setActive(NEWSFEED_VIEW.VIEW_ALL), 500)
          },
          text: 'Close',
        }}
        cpc={cpcs[index]}
        createdAt={cpcs[index]?.createdAt}
        handleBack={() => {
          setSeeMoreCPCs({
            component: WambiList,
            props: {
              cpc: cpcs[index],
              handleBack: setActive(NEWSFEED_VIEW.VIEW_ALL),
              profile,
            },
          })
        }}
        handleSize={handleSize}
        index={index}
        key={index}
        profile={person}
        setActive={setActive}
      />
    )
    return content
  }

  const handleSize = useCallback(
    (index, number) => {
      if (itemSize[index] === number) return
      itemSize[index] = number
      if (listRef && listRef.current) listRef.current.resetAfterIndex(index)
    },
    [itemSize]
  )

  return (
    <Layout cta={{ onClick: handleBack, text: 'Close' }} handleBack={handleBack} id='list-cpcs' inner noFooter title='Wambis'>
      <Container>
        <TabBarWrapper>
          <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />
        </TabBarWrapper>
        <ListItemWrapper>
          <DynamicContainer ref={ref} id='scrollable-cpc-feed'>
            {isLoading ? (
              <Loader />
            ) : cpcs.length ? (
              <DynamicContainer outer>
                <DynamicContainer outer ref={infiniteRef} noScroll>
                  <InfiniteLoader
                    itemCount={loadMore ? cpcs.length + 1 : cpcs.length}
                    isItemLoaded={index => isItemLoaded(index)}
                    loadMoreItems={getMore}
                    threshold={2}
                  >
                    {({ onItemsRendered, ref }) => (
                      <AutoSizer ref={ref}>
                        {({ height, width }) => (
                          <VariableList
                            height={height}
                            itemCount={loadMore ? cpcs.length + 1 : cpcs.length}
                            itemSize={index => itemSize[index] ?? 186}
                            onItemsRendered={onItemsRendered}
                            ref={listRef}
                            width={width}
                          >
                            {({ index, style }) => (cpcs[index] ? <div style={style}>{getContent(index)}</div> : <div style={style} />)}
                          </VariableList>
                        )}
                      </AutoSizer>
                    )}
                  </InfiniteLoader>
                </DynamicContainer>
              </DynamicContainer>
            ) : (
              <NoResultsText>{`No ${currentTab === 0 ? 'received' : 'sent'} Wambis`}</NoResultsText>
            )}
          </DynamicContainer>
        </ListItemWrapper>
      </Container>
    </Layout>
  )
}

WambiList.propTypes = {
  handleBack: PropTypes.func,
  person: PropTypes.object,
  profile: PropTypes.object,
  setActive: PropTypes.func,
  setSeeMoreCPCs: PropTypes.func.isRequired,
}

export default WambiList
