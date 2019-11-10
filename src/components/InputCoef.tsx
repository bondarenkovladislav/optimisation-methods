import React, { useEffect, useState } from 'react'
import {
  Container,
  TextField,
  Grid,
  DialogTitle,
  DialogContent,
} from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import Button from '@material-ui/core/Button'
import { Dialog } from '@material-ui/core'

export const InputCoef = () => {
  const [variablesCount, setVariablesCount] = useState<number>()
  const [rowsCount, setRowsCount] = useState<number>()
  const [coefLabels, setCoefLabels] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [valueArray, setValueArray] = useState<string[][]>()
  const [funcArray, setFuncArray] = useState<string[]>()
  const [openDialog, setOpenDialog] = useState<boolean>(true)

  useEffect(() => {
    if (variablesCount && rowsCount) {
      const tempArr = []
      for (let i = 0; i < variablesCount; i++) {
        tempArr.push(`X${i + 1}`)
      }
      setCoefLabels(tempArr)
      const tempRows = []
      for (let i = 0; i < rowsCount; i++) {
        tempRows.push(i)
      }
      setRows(tempRows)
    }
  }, [variablesCount, rowsCount])

  useEffect(() => {
    if (rows.length && coefLabels.length) {
      initArray()
      initFuncArray()
    }
  }, [rows, coefLabels])

  const initArray = () => {
    const arr: string[][] = []
    rows.forEach(row => {
      const rowArray = []
      const values = coefLabels.forEach(() => {
        rowArray.push('')
      })
      rowArray.push('=')
      rowArray.push('')
      arr.push(rowArray)
    })
    setValueArray(arr)
  }

  const initFuncArray = () => {
    const arr: string[] = []
    coefLabels.forEach(coef => arr.push(''))
    arr.push('')
    arr.push('min')
    setFuncArray(arr)
  }

  const onChangeValue = (i: number, j: number, value: string) => {
    if (valueArray) {
      const resArray = [...valueArray]
      resArray[i][j] = value
      setValueArray(resArray)
    }
  }

  const onFuncValueChange = (i: number, value: string) => {
    if (funcArray) {
      const arr = funcArray.slice()
      arr[i] = value
      setFuncArray(arr)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  return (
    <Container>
      {valueArray && valueArray.length && funcArray && funcArray.length && (
        <div>
          Целевая функция
          <Grid
            container
            direction={'row'}
            justify={'center'}
            alignItems={'center'}
          >
            {coefLabels.map((el, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: '8px',
                }}
              >
                <TextField
                  label={el}
                  value={funcArray[i]}
                  onChange={e => onFuncValueChange(i, e.target.value)}
                />
                <span>+</span>
              </div>
            ))}
            <TextField
              label={'free term'}
              value={funcArray[coefLabels.length]}
              onChange={e =>
                onFuncValueChange(coefLabels.length, e.target.value)
              }
            />
            <span>-></span>
            <Autocomplete
              value={funcArray[coefLabels.length + 1]}
              options={['max', 'min']}
              renderInput={params => <TextField {...params} label={'type'} />}
              onChange={(e, v) => onFuncValueChange(coefLabels.length + 1, v)}
            />
          </Grid>
          Ограничения
          {rows.map((row, i) => (
            <Grid
              key={i}
              container
              direction={'row'}
              justify={'center'}
              alignItems={'center'}
            >
              {coefLabels.map((el, j) => (
                <div
                  key={`${i}${j}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: '8px',
                  }}
                >
                  <TextField
                    label={el}
                    value={valueArray[i][j]}
                    onChange={e => onChangeValue(i, j, e.target.value)}
                  />
                  {j !== coefLabels.length - 1 ? (
                    <span>+</span>
                  ) : (
                    <Grid container direction={'row'}>
                      <Autocomplete
                        value={valueArray[i][coefLabels.length]}
                        options={['=', '!=']}
                        style={{ marginLeft: '8px', marginRight: '8px' }}
                        renderInput={params => (
                          <TextField {...params} label={'type'} />
                        )}
                        onChange={(e, v) => onChangeValue(i, j + 1, v)}
                      />
                      <TextField
                        label={'free term'}
                        value={valueArray[i][coefLabels.length + 1]}
                        onChange={e => onChangeValue(i, j + 2, e.target.value)}
                      />
                    </Grid>
                  )}
                </div>
              ))}
            </Grid>
          ))}
          <Button variant="contained" color="primary">
            Решить симплекс методом
          </Button>
        </div>
      )}
      {openDialog && (
        <Dialog
          aria-labelledby="simple-dialog-title"
          open={openDialog}
          onClose={handleCloseDialog}
        >
          <DialogTitle id="simple-dialog-title">Input Dimensions</DialogTitle>
          <DialogContent>
            <TextField
              label={'Task Dimension'}
              onChange={e => setRowsCount(parseInt(e.target.value, 10))}
            />
            <TextField
              label={'Coef Matrix Dimension'}
              onChange={e => setVariablesCount(parseInt(e.target.value, 10))}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  )
}