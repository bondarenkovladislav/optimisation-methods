import React from 'react';
import logo from './logo.svg';
import styles from './App.module.scss';
import {InputCoef} from "./components/InputCoef";

const App: React.FC = () => {
  return (
    <div className={styles.App}>
      <InputCoef/>
    </div>
  );
}

export default App;
