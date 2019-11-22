import React, { useEffect, useState } from 'react'
import InputStoreService from '../classes/services/InputStoreService'
import { SimplecsCalculator } from '../classes/simplecs'
require('../css/style.css')

export const Simplecs = (props: any) => {
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    const simplics = new SimplecsCalculator(
      InputStoreService.getValueArray(),
      InputStoreService.getFuncArray()
    )
    setResult(simplics.calculate())
  }, [])

  return (
    <div>
      <div className={'result'}></div>
      {result}
    </div>
  )
}
