import { SyntheticEvent } from 'react'
import {Fraction} from "../test/FractionsHelper";

const fs = require('fs')
class InputStoreService {
  private valueArray: { values: any[]; sign: string; b: any }[] = []
  private funcArray: any[] = []
  private maxX: number = 0
  private rowCount: number = 0
  private mode: string = 'min'
  private asFraqtions: boolean = false
  private withSolveBox: boolean = false
  private solveType: number = 1
  private autoSelectOptim: boolean = true
  public xo: string[] = []

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
    let resultFuncArr: any[] = []
    let resultValueArray: { values: any[]; sign: string; b: any }[] = []
    this.valueArray.forEach((array: any, row: number) => {
      resultValueArray[row] = { values: [], sign: '', b: new Fraction('') }
      array.forEach((el: string, col: number) => {
        if (col === array.length - 1) {
          resultValueArray[row].b = new Fraction(<string>el)
          return
        }
        if (el !== '≤' && el !== '≥' && el !== '=') {
          resultValueArray[row].values[
            col === this.maxX + 1 ? col - 1 : col
          ] = new Fraction(<string>el)
        } else {
          resultValueArray[row].sign = el
        }
      })
    })

    this.funcArray.forEach((el: any, i: number) => {
      if (el !== 'min' && el !== 'max') {
        resultFuncArr.push(new Fraction(<string>el))
      } else {
        this.mode = el
      }
    })
    this.funcArray = resultFuncArr
    this.valueArray = resultValueArray
  }

  public getMode = () => {
    return this.mode
  }

  public download(filename: string, text: string) {
    var element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    )
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  public toggleFraction = () => {
    this.asFraqtions = !this.asFraqtions
  }

  public getFraction = () => {
    return this.asFraqtions
  }

  public toggleSolution = () =>  {
    this.withSolveBox = !this.withSolveBox
  }

  public getSolution = () => {
    return this.withSolveBox
  }

  public setSolveType = (value: number) => {
    this.solveType = value
  }

  public getSolveType = () => {
    return this.solveType
  }

  public onimportData = (e: any) => {}

  public toggleAutoselect = () => {
    this.autoSelectOptim = !this.autoSelectOptim
  }

  public getAutoselect = () => {
    return this.autoSelectOptim
  }
}

export default new InputStoreService()
