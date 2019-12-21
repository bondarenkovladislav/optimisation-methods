import { Fraction } from './test/FractionsHelper'

export function Iteration(n, m, iter_item, x0) {
  const history = []
  if (x0 && x0.length) {
    const arr = []
    m.forEach(() => {
      arr.push([])
    })

    x0.forEach((el, index) => {
      if (el === '1') {
        for (let z = 0; z < m.length; z++) {
          arr[z].push(m[z][index])
        }
        history.push(index)
      }
    })
    x0.forEach((el, index) => {
      if (el === '0') {
        for (let z = 0; z < m.length; z++) {
          arr[z].push(m[z][index])
        }
        history.push(index)
      }
    })
    for (let z = 0; z < m.length; z++) {
      arr[z].push(m[z][m[z].length - 1])
    }
    history.push(m[0].length - 1)
    m = arr
  }

  for (iter_item = 0; iter_item < n; iter_item++) {
    let r = m[iter_item][iter_item]
    if (m[iter_item][iter_item].isZero()) m = SwapRows(n, m, iter_item) //Проверка на ноль
    for (let j = 0; j < m[0].length; j++) {
      m[iter_item][j] = m[iter_item][j].div(r) //Делим строку i на а[i][i]
    }
    for (let i = 0; i < n; i++) {
      //Выполнение операций со строками
      if (i !== iter_item && !m[iter_item][iter_item].isZero()) {
        const multel = m[i][iter_item]
        for (let j = iter_item; j < m[0].length; j++) {
          const mul = m[iter_item][j].mult(multel)
          m[i][j] = m[i][j].sub(mul)
        }
      }
    }
  }
  if (x0 && x0.length) {
    const returned = []
    m.forEach(() => {
      returned.push([])
    })

    history.forEach(el => {
      for (let z = 0; z < m.length; z++) {
        returned[z].push(m[z][el])
      }
    })
    m = returned
  }
  return m
}
function SwapRows(n, m, iter_item) {
  //Функция перемены строк
  for (let i = iter_item + 1; i < n; i++) {
    if (m[i][iter_item] !== 0) {
      for (let j = 0; j <= n; j++) {
        let k = m[i - 1][j]
        m[i - 1][j] = m[i][j]
        m[i][j] = k
      }
    }
  }
  return m
}
function Answers(m, n, l) {
  //Функция поиска и вывода корней
  l[n - 1] = m[n - 1][n].div(m[n - 1][n - 1])
  for (let i = n - 2; i >= 0; i--) {
    let k = new Fraction()
    for (let j = n - 1; j > i; j--) {
      const mul = m[i][j].mult(l[j])
      k = mul.add(k)
    }
    l[i] = m[i][n].sub(k)
  }
  // document.write('x' + i + ' = ' + l[i - 1])
  return l
}

function print(m) {
  m.forEach(arr => {
    let str = ''
    arr.forEach(el => (str += `${el.print()} `))
    console.log(str)
    console.log('----------------')
  })
}
