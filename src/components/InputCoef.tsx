import React, { useEffect, useState } from 'react'
import Checkbox from '@material-ui/core/Checkbox';
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
//@ts-ignore
import { useHistory } from 'react-router-dom'
import InputStoreService from '../classes/services/InputStoreService'
import {Simplecs} from "./Simplecs";
import {init} from "../classes/test/1";

declare global {
  interface Window { Solve: any; }
}


const comboItems = [
  {
    title:'Симплекс-метод',
    value: 1
  },{
    title:'Метод искусственного базиса',
    value: 2
  }
]

export const InputCoef = () => {
  const [variablesCount, setVariablesCount] = useState<number>()
  const [rowsCount, setRowsCount] = useState<number>()
  const [coefLabels, setCoefLabels] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [valueArray, setValueArray] = useState<string[][]>()
  const [funcArray, setFuncArray] = useState<string[]>()
  const [openDialog, setOpenDialog] = useState<boolean>(true)
  let history = useHistory()
  const [shouldInit, setShouldInit] = useState<boolean>(false)

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
    if (shouldInit) {
      const arr: string[][] = []
      rows.forEach((row, i) => {
        const rowArray = []
        const values = coefLabels.forEach((col, j) => {
          rowArray.push(`${j}`)
        })
        rowArray.push('≤')
        rowArray.push(`${100}`)
        arr.push(rowArray)
      })
      setValueArray(arr)
    }
  }

  const initFuncArray = () => {
    if (shouldInit) {
      const arr: string[] = []
      coefLabels.forEach((coef, i) => arr.push(`${i}`))
      arr.push(`${10}`)
      arr.push('min')
      setFuncArray(arr)
    }
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

  const updateStates = (res: any) => {
    setRowsCount(res.rowCount)
    setVariablesCount(res.maxX)
    setValueArray(res.valueArray)
    setFuncArray(res.funcArray)
  }

  const appendBaes = () => {
    if (valueArray) {
      const copy = valueArray.slice()
      copy.forEach(row => {
        row.splice(row.length - 3, 0, '1')
      })
    }
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
                        options={['≤', '=', '≥']}
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
          Использовать дроби <Checkbox onChange={InputStoreService.toggleFraction} />
          С решением <Checkbox onChange={InputStoreService.toggleSolution} />
          Ручной выбор оптимального элемента <Checkbox onChange={InputStoreService.toggleAutoselect} />

          <Autocomplete
              id="combo-box-demo"
              autoComplete={false}
              disableClearable={true}
              options={comboItems}
              getOptionLabel={(option) => option.title}
              style={{ width: 300 }}
              renderInput={params => (
                  <TextField {...params} label="Метод решения" variant="outlined" fullWidth />
              )}
              onChange={(e, value) => InputStoreService.setSolveType(value.value)}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              InputStoreService.setFuncArray(funcArray)
              InputStoreService.setValueArray(valueArray)
              if (variablesCount && rowsCount) {
                InputStoreService.setMaxX(variablesCount)
                InputStoreService.setRowCount(rowsCount)
              }
              InputStoreService.inputPreprocess()
              init()
              window.Solve()
              // history.push('/simplecs')
            }}
          >
            Решить
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const exportObject = {
                maxX: variablesCount,
                rowCount: rowsCount,
                funcArray: funcArray,
                valueArray: valueArray,
              }
              InputStoreService.download(
                'export.txt',
                JSON.stringify(exportObject)
              )
            }}
          >
            Экспорт
          </Button>
        </div>
      )}
      {openDialog && (
        <Dialog
          aria-labelledby="simple-dialog-title"
          open={openDialog}
          onClose={handleCloseDialog}
        >
          <DialogTitle id="simple-dialog-title">
            Введите размерность
          </DialogTitle>
          <DialogContent>
            <TextField
              label={'Task Dimension'}
              onChange={e => {
                setRowsCount(parseInt(e.target.value, 10))
                setShouldInit(true)
              }}
            />
            <TextField
              label={'Coef Matrix Dimension'}
              onChange={e => {
                setVariablesCount(parseInt(e.target.value, 10))
                setShouldInit(true)
              }}
            />
            <input
              type="file"
              name="file"
              onChange={e => {
                const files = e.target.files
                if (files && files.length) {
                  const reader = new FileReader()
                  reader.onload = () => {
                    const res = JSON.parse(reader.result as string)
                    updateStates(res)
                  }
                  reader.onerror = function() {
                    console.log(reader.error)
                  }
                  reader.readAsText(files[0])
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      <div id={'simplex-solve'}></div>
    </Container>
  )
}
