import { useEffect, useState } from 'react'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { LanguageSelector } from '@components'
import { useLangContext } from '@contexts'
import { api } from '@services'

let lastNewId = 0

const QuestionSetsEditor = () => {
  const { lang } = useLangContext()

  const [questionSetGridApi, setQuestionSetGridApi] = useState()
  const [questionSetItems, setQuestionSetItems] = useState()
  const [questionSetItemsGridApi, setQuestionSetItemsGridApi] = useState()
  const [questionSets, setQuestionSets] = useState()
  const [selectedQuestionSet, setSelectedQuestionSet] = useState()
  const [selectedQuestionSetItem, setSelectedQuestionSetItem] = useState()

  const onQuestionSetGridReady = async params => {
    setQuestionSetGridApi(params.api)

    let { data } = await api.get('/config/questionSets/list')
    setQuestionSets(data.questionSetsForAccount)

    setTimeout(() => {
      params.api.forEachNode(node => {
        if (node.rowIndex === 0) {
          node.setSelected(true)
        }
      })
    }, 0)
  }

  const onQuestionSetItemsGridReady = async params => {
    setQuestionSetItemsGridApi(params.api)
  }

  const newQuestionSet = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setQuestionSets([...questionSets, { id: --lastNewId, name: '' }])
  }

  const newQuestionSetItem = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setQuestionSetItems([
      ...questionSetItems,
      { id: --lastNewId, name: '', questionSetId: selectedQuestionSet.id, order: questionSetItems.length + 1 },
    ])
  }

  const saveQuestionSetItems = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/questionSetItems/save', { inserted: data, lang })

      // Merge ID back into record based on negative id...EK
      let newRow = questionSetItemsGridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/questionSetItems/save', { lang, updated: data })
    }
  }

  useEffect(() => {
    if (questionSetGridApi) questionSetSelected()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const saveQuestionSets = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/questionSets/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = questionSetGridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/questionSets/save', { updated: data })
    }
  }

  const questionSetSelected = async () => {
    let selRec = questionSetGridApi.getSelectedRows()[0]
    setSelectedQuestionSet(selRec)

    setQuestionSetItems(null)
    let { data } = await api.post('/config/questionSetItems/list', { lang, questionSetId: selRec.id })
    setQuestionSetItems(data.questionsForSet)
  }

  const deleteQuestionSetItem = async () => {
    if (selectedQuestionSetItem == null) return alert('No record selected to delete.')

    if (confirm(`About to delete '${selectedQuestionSetItem.question}'.  Are you sure you want to do this?`)) {
      const {
        data: { msg, success },
      } = await api.post('/config/questionSetItems/save', { deleted: selectedQuestionSetItem })

      if (success) {
        setQuestionSetItems(questionSetItems.filter(r => r.id !== selectedQuestionSetItem.id))
        setSelectedQuestionSetItem(null)
      } else {
        alert(msg)
      }
    }
  }

  const deleteQuestionSet = async () => {
    if (selectedQuestionSet == null) return alert('No record selected to delete.')

    if (confirm(`About to Delete '${selectedQuestionSet.name}'.  Are you sure you want to do this?`)) {
      let {
        data: { msg, success },
      } = await api.post('/config/questionSets/save', { deleted: selectedQuestionSet })

      if (success) {
        setQuestionSets(questionSets.filter(qs => qs.id !== selectedQuestionSet.id))
        setSelectedQuestionSet(null)
      } else {
        alert(msg)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
        <div style={{ width: 300, margin: 5 }}>
          <div>
            <button onClick={newQuestionSet}>New Set</button>
            <button onClick={deleteQuestionSet}>Delete Set</button>
          </div>

          <div
            id='questionSetGrid'
            style={{
              height: '100%',
              width: '100%',
            }}
            className='ag-theme-alpine'
          >
            <AgGridReact
              modules={[ClientSideRowModelModule]}
              defaultColDef={{
                flex: 1,
                editable: true,
                resizable: true,
              }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              onGridReady={onQuestionSetGridReady}
              onCellValueChanged={saveQuestionSets}
              rowData={questionSets}
              getRowNodeId={data => data.id}
              rowSelection={'single'}
              onSelectionChanged={questionSetSelected}
            >
              <AgGridColumn field='id' editable={false} />
              <AgGridColumn field='name' headerName='Question Set' minWidth={160} />
            </AgGridReact>
          </div>
        </div>

        <div
          style={{
            height: '100%',
            width: '100%',
            margin: 5,
          }}
        >
          <div style={{ display: 'flex' }}>
            <button onClick={newQuestionSetItem}>New Question</button>
            <button onClick={deleteQuestionSetItem} style={{ marginRight: '20px' }}>
              Delete Question
            </button>
            <LanguageSelector />
          </div>

          <div
            id='questionSetItemGrid'
            style={{
              height: '100%',
              width: '100%',
            }}
            className='ag-theme-alpine'
          >
            <AgGridReact
              modules={[ClientSideRowModelModule]}
              defaultColDef={{
                editable: true,
                resizable: true,
              }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              onGridReady={onQuestionSetItemsGridReady}
              onCellValueChanged={saveQuestionSetItems}
              rowData={questionSetItems}
              getRowNodeId={data => data.id}
              rowSelection={'single'}
              onSelectionChanged={() => setSelectedQuestionSetItem(questionSetItemsGridApi.getSelectedRows()[0])}
            >
              <AgGridColumn field='id' editable={false} width={100} />
              <AgGridColumn field='order' width={100} />
              <AgGridColumn field='question' flex={1} />
              {lang !== 'en' ? (
                <AgGridColumn field='questionTrans' headerName={`Question Translation - ${lang.toUpperCase()}`} flex={1} />
              ) : (
                <></>
              )}
            </AgGridReact>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionSetsEditor
