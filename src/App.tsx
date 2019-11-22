import React from 'react'
import logo from './logo.svg'
import styles from './App.module.scss'
import { InputCoef } from './components/InputCoef'
//@ts-ignore
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'
import { Simplecs } from './components/Simplecs'

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route exact path="/">
            <InputCoef />
          </Route>
          <Route exact path="/simplecs">
            <Simplecs />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
