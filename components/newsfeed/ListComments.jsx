import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroll-component'
import styled from 'styled-components'

import { Comment, DynamicContainer, Loader, Layout } from '@components'
import { coreApi } from '@services'

const InfiniteCommentsScroll = styled(InfiniteScroll)`
  display: flex;
  // reverses the comments list...PS
  flex-direction: column-reverse;
  padding: 2.5rem 2rem 0 2rem;
  // For IOS mobile z-index issue. Needs important to overwrite package default style..JK
  -webkit-overflow-scrolling: auto !important;
`

const Wrapper = styled(DynamicContainer)`
  padding-bottom: 20px;
`

const ListComments = ({ cta, feedId, handleBack, newComments }) => {
  const [comments, setComments] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const scrollableId = `scrollable-comments-${feedId}`

  useEffect(() => {
    // scroll user to bottom on modal open...PS
    const scrollToBottom = () => {
      const ele = document.getElementById(scrollableId)
      if (comments.length <= 20) {
        ele.scrollTop = ele.scrollHeight
      }
    }

    scrollToBottom()
  }, [comments, scrollableId])

  useEffect(() => {
    if (feedId && newComments) {
      const getComments = async () => {
        const {
          data: { success, comments },
        } = await coreApi.post('/newsfeed/comments/list', { feedId })
        if (success) {
          if (comments.length === 0) return setHasMore(false)
          setComments(comments)
          setHasMore(true)
          setPage(1)
        }
      }
      getComments()
    }
  }, [feedId, newComments])

  const getMore = async () => {
    const {
      data: { success, comments: latestComments },
    } = await coreApi.post('/newsfeed/comments/list', { feedId, page })

    if (success) {
      if (latestComments.length === 0) return setHasMore(false)

      // element always goes to scroll 0 after loading, so this makes sure there's some space to get more...KA
      const ele = document.getElementById(scrollableId)
      ele.scrollTop = 1

      setComments([...comments, ...latestComments])
      setPage(p => p + 1)
      setHasMore(true)
    }
  }

  return (
    <Layout cta={cta} handleBack={handleBack} id='list-comments' inner noFooter title='Comments'>
      <Wrapper id={scrollableId}>
        <InfiniteCommentsScroll
          dataLength={comments.length}
          hasMore={hasMore}
          inverse={true}
          loader={<Loader />}
          next={getMore}
          scrollableTarget={scrollableId}
        >
          {comments.map(({ authorId, authorImg, comment, createdAt, name }, i) => (
            <Comment authorId={authorId} comment={comment} createdAt={createdAt} image={authorImg} index={i} key={i} name={name} />
          ))}
        </InfiniteCommentsScroll>
      </Wrapper>
    </Layout>
  )
}

ListComments.propTypes = {
  cta: PropTypes.object,
  feedId: PropTypes.number,
  handleBack: PropTypes.func,
  newComments: PropTypes.array,
}

export default ListComments
