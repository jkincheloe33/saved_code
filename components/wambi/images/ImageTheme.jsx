import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, GridViewIcon, ListViewIcon } from '@assets'
import { DynamicContainer, Image as ImageBase, Layout, Loader, Paragraph, Title } from '@components'
import { usePostContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType } from '@utils'

const Content = styled.div`
  border-bottom: 1px solid ${colors.gray3}20;
  margin: 0 auto 15px;
  padding-bottom: 15px;
  width: calc(100% - 44px);
`

const Header = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 30px 22px 15px;
`

const Image = styled(ImageBase)`
  border-radius: ${p => (p.listView ? '15px' : 0)};
`

const ImageWrapper = styled.div`
  cursor: pointer;
  flex: 0 0 ${p => (p.listView ? '100%' : '50%')};
  padding: ${p => (p.listView ? '15px 20px' : '2px')};
  width: ${p => (p.listView ? '100%' : '50%')};
  transition: transform 250ms ease;

  &:first-of-type {
    padding-top: 2px;
  }

  @media (${devices.largeDesktop}) {
    &:hover {
      transform: scale(0.95);
    }
  }
`

const InfiniteImageLoader = styled(InfiniteScroll)`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  margin-top: 25px;
  width: 100%;
`

const List = styled.div`
  display: flex;
  justify-content: flex-end;

  svg {
    cursor: pointer;
    margin-left: 10px;
    width: 19px;
  }
`

const ImageTheme = ({ cpcScreens, cta, handleBack, setActive, setCpcData }) => {
  const [listView, setListView] = useState(false)
  const [loadMoreTypes, setLoadMoreTypes] = useState(true)
  const [page, setPage] = useState(0)
  const [types, setTypes] = useState([])

  const { selectedCpcTheme } = usePostContext()

  const getMoreImages = async () => {
    const {
      data: { success, types: newTypes },
    } = await coreApi.post('/wambi/types/getWambiTypes', { page, themeId: selectedCpcTheme.id })
    if (success) {
      if (newTypes.length === 0) return setLoadMoreTypes(false)
      setTypes([...types, ...newTypes])
      setPage(page + 1)
    } else {
      setLoadMoreTypes(false)
    }
  }

  const handleSelect = type => {
    setCpcData(cpcData => ({ ...cpcData, type }))
    setActive(cpcScreens.COMPOSE)
  }

  useEffect(() => {
    const getInitialImageList = async () => {
      const {
        data: { success, types },
      } = await coreApi.post('/wambi/types/getWambiTypes', { page, themeId: selectedCpcTheme.id })
      if (success) {
        if (types.length === 0) return setLoadMoreTypes(false)
        setTypes(types)
        setPage(1)
      } else {
        setLoadMoreTypes(false)
      }
    }

    getInitialImageList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout cta={cta} handleBack={handleBack} id='image-theme-screen' inner noFooter title='Send a Wambi'>
      <DynamicContainer id='cpc-theme-scroll'>
        <Header>
          <Title fontSize='22px'>{selectedCpcTheme.name}</Title>
          <List>
            <GridViewIcon color={!listView && colors.blurple} onClick={() => setListView(false)} />
            <ListViewIcon color={listView && colors.blurple} onClick={() => setListView(true)} />
          </List>
        </Header>
        <Content>
          <Paragraph>{selectedCpcTheme.description}</Paragraph>
        </Content>
        <InfiniteImageLoader
          dataLength={types.length}
          hasMore={loadMoreTypes}
          loader={<Loader />}
          next={getMoreImages}
          scrollableTarget='cpc-theme-scroll'
          threshold={2}
        >
          {types.map((type, i) => (
            <ImageWrapper key={i} listView={listView} onClick={() => handleSelect(type)}>
              <Image alt={`${selectedCpcTheme.name} Wambi`} listView={listView} src={type.src} width='100%' />
            </ImageWrapper>
          ))}
        </InfiniteImageLoader>
      </DynamicContainer>
    </Layout>
  )
}

ImageTheme.propTypes = {
  ...CpcWorkflowType,
  handleBack: PropTypes.func.isRequired,
}

export default ImageTheme
