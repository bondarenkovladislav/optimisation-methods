import { array, number } from 'prop-types'

class InputStoreService {
  private valueArray: string[][] | number[][] = []
  private funcArray: string[] | number[] = []
  private maxX: number = 0
  private rowCount: number = 0

  public setValueArray = (array: any[]) => {
    this.valueArray = array
  }

  public setFuncArray = (array: any[]) => {
    this.funcArray = array
  }

  public getValueArray = () => {
    return this.valueArray.slice()
  }

  public getFuncArray = () => {
    return this.funcArray.slice()
  }

  public setMaxX = (value: number) => {
    this.maxX = value
  }

  public getMaxX = () => {
    return this.maxX
  }

  public setRowCount = (value: number) => {
    this.rowCount = value
  }

  public getRowCount = () => {
    return this.rowCount
  }

  public inputPreprocess = () => {
    let resultFuncArr: number[] = []
    let resultValueArray: number[][] = []
    this.valueArray.forEach((array: any, row: number) => {
      resultValueArray[row] = []
      let multCoef = 1
      array.forEach((el: string, col: number) => {
        if (el !== '<=' && el !== '>=') {
          resultValueArray[row][
            col === this.maxX + 1 ? col - 1 : col
          ] = parseInt(el, 10)
        } else if (el === '>=') {
          multCoef = -1
        }
      })
      resultValueArray[row] = resultValueArray[row].map(
        (el: number) => el * multCoef
      )
    })

    let multCoef = 1
    this.funcArray.forEach((el: any, i: number) => {
      if (el !== 'min' && el !== 'max') {
        resultFuncArr.push(parseInt(el, 10))
      } else if (el === 'max') {
        multCoef = -1
      }
    })
    resultFuncArr = resultFuncArr.map((el: number) => el * multCoef)

    this.funcArray = resultFuncArr
    this.valueArray = resultValueArray
  }
}

export default new InputStoreService()
