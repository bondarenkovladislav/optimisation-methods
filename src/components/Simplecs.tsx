import React, { useEffect, useState } from 'react'
import InputStoreService from '../classes/services/InputStoreService'
import { SimplecsCalculator } from '../classes/simplecs'
// import {Solve} from "../classes/test/1";
require('../css/style.css')

export const Simplecs = (props: any) => {
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    // const simplics = new SimplecsCalculator(
    //   InputStoreService.getValueArray(),
    //   InputStoreService.getFuncArray()
    // )
    // setResult(simplics.calculate())
    // Solve()
  }, [])

  return (
    <div>
      <div id={'simplex-solve'}></div>
      {/*<div className={'result'}></div>*/}
      {/*{result}*/}
    </div>
  )
}
