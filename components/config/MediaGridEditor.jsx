import { useState } from 'react'
import { AgGridColumn, AgGridReact } from '@ag-grid-community/react'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import numbro from 'numbro'

import { api } from '@services'

const MediaGridEditor = () => {
  const [cdnHost, setCDNHost] = useState('')
  const [gridApi, setGridApi] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const handleMediaDeletion = async () => {
    if (selectedRecord == null) {
      alert('Please select a media record to delete and try again.')
    } else {
      if (confirm(`Are you sure you want to delete '${selectedRecord.uploadName}'`)) {
        let { data: deleteRes } = await api.post('/config/media/delete', { mediaId: selectedRecord.id })
        if (deleteRes.success === true) {
          setSelectedRecord(null)
          gridApi.refreshInfiniteCache()
        } else {
          console.error('Failed to delete media record; check server logs')
        }
      }
    }
  }

  const handleMediaUpload = () => {
    let fileInput = document.getElementById('manual-upload-media')

    fileInput.onchange = async () => {
      let uploadCategory = prompt('What Category to upload into (i.e. interests, reactions, people)?', 'people')

      // Push the file to the server...EK
      let formData = new FormData()
      formData.append('category', uploadCategory || 'people')
      formData.append('mediaUpload', fileInput.files[0])

      let { data: mediaSaveRes } = await api.post('/config/media/manualUpload', formData)

      if (mediaSaveRes.success === true) {
        gridApi.refreshInfiniteCache()
      } else {
        console.error('Media Save Issue: ', mediaSaveRes.msg)
      }

      fileInput.value = null
    }

    fileInput.click()
  }

  const onGridReady = async params => {
    setGridApi(params.api)

    const dataSource = {
      rowCount: null,
      getRows: async params => {
        const { endRow, filterModel: filter, sortModel: sort, startRow } = params

        const {
          data: { mediaForAccount, cdnHost: host },
        } = await api.post('/config/media/list', { endRow, filter, sort, startRow })

        setCDNHost(host)

        const lastRow = mediaForAccount.length < endRow - startRow ? startRow + mediaForAccount.length : -1

        params.successCallback(mediaForAccount, lastRow)
      },
    }

    params.api.setDatasource(dataSource)
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <input id='manual-upload-media' type='file' hidden />
        <button onClick={handleMediaUpload}>Manual Upload</button>
        <button onClick={handleMediaDeletion}>Delete</button>
      </div>

      <div
        className='ag-theme-alpine'
        id='myGrid'
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <AgGridReact
          cacheOverflowSize={2}
          components={{
            loadingRenderer: function (params) {
              if (params.value != null) {
                return params.value
              } else {
                return '<img src="https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/images/loading.gif" />'
              }
            },
          }}
          defaultColDef={{
            flex: 1,
            resizable: true,
            filter: true,
            sortable: true,
          }}
          getRowNodeId={data => data.id}
          infiniteInitialRowCount={1}
          maxBlocksInCache={20}
          maxConcurrentDatasourceRequests={2}
          modules={[InfiniteRowModelModule]}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
          paginationPageSize={25}
          rowBuffer={0}
          rowModelType={'infinite'}
          rowSelection={'single'}
        >
          <AgGridColumn field='id' width={80} />
          <AgGridColumn field='category' minWidth={200} />
          <AgGridColumn field='uploadName' minWidth={200} />
          <AgGridColumn
            field='byteSize'
            filter={false}
            headerName='Size'
            minWidth={200}
            valueFormatter={({ value }) =>
              value && numbro(value).format({ output: 'byte', base: 'binary', mantissa: 1, spaceSeparated: true })
            }
          />
          <AgGridColumn field='usages' filter={false} minWidth={160} />
        </AgGridReact>
      </div>

      {selectedRecord && (
        <div>
          {selectedRecord.mimeType.startsWith('image') && (
            <div>
              <img src={`${cdnHost}/${selectedRecord.category}/${selectedRecord.uid}.${selectedRecord.ext}`} />
              <br />
              <br />
              <br />
              <br />
            </div>
          )}
          {selectedRecord.mimeType.startsWith('video') && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <span>Movie Preview</span>
              <video src={`${cdnHost}/${selectedRecord.category}/${selectedRecord.uid}.${selectedRecord.ext}`} autoPlay controls />
              <br />
              <br />
              <br />
              <br />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MediaGridEditor
