import InputStoreService from '../services/InputStoreService'
import { Fraction } from './FractionsHelper'
import { bigInt } from './BigInt'
import { Iteration } from '../Gauss'
const clonedeep = require('lodash.clonedeep')

const MAX = 'max'
const MIN = 'min'
let printMode = 1
function CreateHideOpenBlock(text, content) {
  let html = "<div class='hide-open-block'>"
  html +=
    "<div class='ho-block-text'><span class='fa fa-caret-right'></span>" +
    text +
    '</div>'
  html += "<div class='ho-block-content'>" + content + '</div>'
  html += '</div>'
  return html
}
function CreateScrollBlock(text) {
  return "<div class='scroll-block'>" + text + '</div>'
}
function PrintFunction(func) {
  let html = ''
  let start = false
  for (let i = 0; i < func.length; i++) {
    if (!func[i].n.isZero()) {
      if (start && func[i].isPos()) {
        html += '+ '
      }
      if (func[i].isNeg()) {
        if (func[i].abs().isOne()) html += '- '
        else html += '- ' + func[i].abs().print(printMode) + '·'
      } else {
        if (!func[i].isOne()) html += func[i].print(printMode) + '·'
      }
      html += 'x<sub>' + (i + 1) + '</sub> '
      start = true
    }
  }
  if (!start) html += '0'
  return html
}
function PrepareData(func, restricts, mode) {
  if (mode === MAX) {
    for (let i = 0; i < func.length; i++) {
      func[i] = func[i].mult(new Fraction('-1'))
    }
    mode = MIN
  }
  for (let i = 0; i < restricts.length; i++) {
    if (restricts[i].b < 0) {
      for (let j = 0; j < restricts[i].values.length; j++) {
        restricts[i].values[j] = restricts[i].values[j].mult(new Fraction('-1'))
      }
      restricts[i].b = restricts[i].b.mult(new Fraction('-1'))
    }
  }
  return [func, restricts, mode]
}
function PrepareTable(n, m, func, restricts, mode) {
  [func, restricts, mode] = PrepareData(func, restricts, mode)
  const res = []
  let k = 0
  if (InputStoreService.getSolveType() === 2) {
    k = m
  }
  // for (let i = 0; i < restricts.length; i++) if (restricts[i].sign != EQ) k++
  let simplex = {
    n: n,
    m: m,
    total: n,
    mode: mode,
    table: [],
    b: [],
    basis: [],
    C: [],
    deltas: [],
    Q: [],
    row: [],
    fn: [],
  }
  let html = ''
  // if (!InputStoreService.xo.length) {
  if (k > 2) {
    html +=
      'Для каждого ограничения <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub>..x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 2) {
    html +=
      'Для каждого ограничения <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub> и x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 1) {
    html +=
      'Для ограничения <b>добавляем дополнительную переменную</b> x<sub>' +
      (n + 1) +
      '</sub>.<br>'
  }
  // }

  for (let i = 0; i < n; i++) simplex.C.push(func[i])
  for (let i = 0; i < k; i++) simplex.C.push(new Fraction())
  simplex.C.push(new Fraction('0'))
  let findHtml = ''
  if (InputStoreService.getSolveType() === 2) {
    findHtml = !InputStoreService.xo.length
      ? '<b>Ищем начальное базисное решение:</b><br>'
      : ''
  }

  let index = 0
  let basisHtml = []
  let systemHtml = ''
  let pasteIndex = 0
  for (let i = 0; i < m; i++) {
    simplex.table[i] = []
    for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j])
    let inserted = false

    // simplex.basis.push(unknown)
    // unknown--
    // if (!InputStoreService.getSolveType() === 2) {
    //   if (restricts[i].sign == EQ) {
    //     simplex.basis.push(unknown)
    //     unknown--
    //     basisHtml[simplex.basis.length - 1] =
    //       'Ограничение ' +
    //       (i + 1) +
    //       ' содержит равенство. Базисная переменная для этого ограничения будет определена позднее.<br>'
    //   } else if (NEGATIVE_BASIS && restricts[i].sign == GE) {
    //     simplex.basis.push(unknown)
    //     unknown--
    //     basisHtml[simplex.basis.length - 1] =
    //       'Ограничение ' +
    //       (i + 1) +
    //       ' содержит неравенство с ' +
    //       GE +
    //       '. Базисная переменная для этого ограничения будет определена позднее.<br>'
    //   }
    // }
    // debugger
    // if (InputStoreService.getSolveType() === 2) {
    //   for (let j = 0; j < k; j++) {
    //     // if (restricts[i].sign == EQ) {
    //
    //     // } else if (!NEGATIVE_BASIS || restricts[i].sign == LE) {
    //     //   if (j != index || inserted) {
    //     //     simplex.table[sii].push(new Fraction('0'))
    //     //   } else
    //     if (!inserted && j === pasteIndex) {
    //       // simplex.table[i].push(new Fraction('1'))
    //       simplex.basis.push(n + index)
    //       // basisHtml[simplex.basis.length - 1] =
    //       //   'Ограничение ' +
    //       //   (i + 1) +
    //       //   ' содержит неравенство, базисной будет добавленная дополнительная переменная x<sub>' +
    //       //   (n + index + 1) +
    //       //   '</sub><br>'
    //       index++
    //       inserted = true
    //       pasteIndex++
    //     } else {
    //       // simplex.table[i].push(new Fraction('0'))
    //     }
    //     // } else if (NEGATIVE_BASIS) {
    //     //   if (j != index || inserted) {
    //     //     simplex.table[i].push(new Fraction('0'))
    //     //   } else if (!inserted) {
    //     //     simplex.table[i].push(new Fraction('-1'))
    //     //     index++
    //     //     inserted = true
    //     //   }
    //     // }
    //   }
    // }
    simplex.b[i] = restricts[i].b
    systemHtml +=
      PrintFunction(simplex.table[i]) +
      ' = ' +
      simplex.b[i].print(printMode) +
      '<br>'
  }
  if(InputStoreService.getSolveType() === 1) {
    let unknown = -1
    for (let i = 0; i < m; i++) {
      if (simplex.basis[i] > -1) continue
      let column = GetIdentityColumn(simplex, i)
      if (column == -1) {
        simplex.basis[i] = unknown--
      } else {
        simplex.basis[i] = column
        basisHtml[i] =
            'Столбец ' +
            (column + 1) +
            ' является частью единичной матрицы. Переменная x<sub>' +
            (column + 1) +
            '</sub> входит в начальный базис<br>'
      }
    }
  }
  if (k > 0) {
    html += 'Перепишем ограничения в каноническом виде:<br>'
    html += systemHtml + '<br>'
  }
  if (!InputStoreService.xo.length) {
    html += findHtml + basisHtml.join('') + '<br>'
  }

  if (InputStoreService.xo && InputStoreService.xo.length) {
    simplex.basis = []
    InputStoreService.xo.forEach((el, index) => {
      if (el === '1') {
        simplex.basis.push(index)
      } else {
        simplex.row.push(index)
      }
    })
  } else {
    if (InputStoreService.getSolveType() === 1) {
      for (let i = 0; i < restricts[0].values.length; i++) {
        if (i < simplex.basis.length) {
          simplex.basis[i] = i
        } else {
          simplex.row.push(i)
        }
        // if (simplex.basis[i] > -1) continue
        // let column = i
        // simplex.basis[i] = column
        // if (column > -1) {
        //   html +=
        //     'В качестве базисной переменной ?<sub>' +
        //     -simplex.basis[i] +
        //     '</sub> берём x<sub>' +
        //     (column + 1) +
        //     '</sub>'
        //   html +=
        //     '. Делим строку ' +
        //     (i + 1) +
        //     ' на ' +
        //     simplex.table[i][column].print(printMode) +
        //     '.<br>'
        //   DivRow(simplex, i, simplex.table[i][column])
        //   simplex.basis[i] = column
        // } else {
        //   column = 0
        //   while (column < simplex.total) {
        //     if (IsBasisVar(simplex, column) || simplex.table[i][column].isZero()) {
        //       column++
        //     } else {
        //       break
        //     }
        //   }
        //   if (column == simplex.total) {
        //     if (IsRowZero(simplex, i)) {
        //       html +=
        //         'Условие ' +
        //         (i + 1) +
        //         ' линейно зависимо с другими условиями. Исключаем его из дальнейшего расмотрения.<br>'
        //       RemoveZeroRow(simplex, i)
        //       html += 'Обновлённая симплекс-таблица:'
        //       html += PrintTable(simplex)
        //       i--
        //       continue
        //     } else {
        //       html += '<br><b>Таблица:</b>'
        //       html += PrintTable(simplex)
        //       return (
        //         html +
        //         '<br>Обнаружено противоречивое условие. <b>Решение не существует</b>'
        //       )
        //     }
        //   }
        //   html += MakeVarBasis(simplex, i, column, true)
        // }
      }
    }
    else {
      for(let i = 0; i< m; i++) {
        simplex.basis.push(simplex.n + i)
      }
      for(let i=0; i< restricts[0].values.length; i++) {
        simplex.row.push(i)
      }
    }
  }

  const copy = []
  if (InputStoreService.getSolveType() === 1) {
    restricts.forEach(el => copy.push([...el.values, el.b]))
  }
  // else {
  //   restricts.forEach((arr, i) => {
  //     copy.push([])
  //     arr.values.forEach(el => {
  //       copy[i].push(el)
  //     })
  //     simplex.basis.forEach((item, j) => {
  //       if (j === i) {
  //         copy[i].push(new Fraction('1'))
  //       } else {
  //         copy[i].push(new Fraction())
  //       }
  //     })
  //     copy[i].push(arr.b)
  //   })
  // }

  let x0 = InputStoreService.xo
  // if (InputStoreService.getSolveType() === 2) {
  //   x0 = []
  //   for (let b = 0; b < n; b++) {
  //     x0.push('0')
  //     simplex.row.push(b)
  //   }
  //   simplex.basis.forEach(() => x0.push('1'))
  // }

  if (InputStoreService.getSolveType() === 1) {
    const gauss = Iteration(restricts.length, copy, restricts.length, x0)
    const tableArr = []
    const bArr = []
    gauss.forEach((arr, index) => {
      bArr.push(arr[arr.length - 1])
      tableArr.push([])
      arr.forEach((el, j) => {
        if (j < restricts.length || j === restricts[0].values.length) return
        tableArr[index].push(clonedeep(el))
      })
    })
    simplex.table = tableArr
    simplex.b = bArr
    simplex.total = tableArr[0].length
    simplex.n = tableArr[0].length
  }

  // const answer = []
  // let i = 0
  // for (i = 0; i < simplex.table[0].length; i++) {
  //   answer.push(new Fraction())
  //   for (let j = 0; j < simplex.table.length; j++) {
  //     answer[i] = answer[i].add(
  //       simplex.table[j][i].mult(func[simplex.basis[j]])
  //     )
  //   }
  //   const l = func[simplex.b[i]]
  //   answer[i] = answer[i].add(l)
  // }

  // answer.push(new Fraction())
  // for (let j = 0; j < simplex.table.length; j++) {
  //   answer[i] = answer[i].add(simplex.b[j].mult(func[simplex.basis[j]]))
  // }
  // simplex.fn = answer
  return { simplex: simplex, html: html }
}
function CheckBasis(simplex) {
  for (let i = 0; i < simplex.m; i++) if (simplex.basis[i] < 0) return false
  return true
}
function MakeVarBasis(simplex, row, column, print = false) {
  let html = ''
  if (simplex.basis[row] < 0)
    html +=
      'В качестве базисной переменной ?<sub>' +
      -simplex.basis[row] +
      '</sub> берём x<sub>' +
      (column + 1) +
      '</sub>.<br>'
  else
    html +=
      'В качестве базисной переменной x<sub>' +
      (simplex.basis[row] + 1) +
      '</sub> берём x<sub>' +
      (simplex.row[column] + 1) +
      '</sub>.<br>'
  const item = simplex.row[column]
  simplex.row[column] = simplex.basis[row]
  simplex.basis[row] = item
  if (print) html += PrintTable(simplex, row, column)
  let x = simplex.table[row][column]
  if (!x.isOne())
    html += 'Делим строку ' + (row + 1) + ' на ' + x.print(printMode) + '. '
  let rows = []
  for (let i = 1; i <= simplex.m; i++) if (i != row + 1) rows.push(i)
  if (rows.length > 1) html += 'Из строк ' + rows.join(', ')
  else html += 'Из строки ' + rows[0]
  html +=
    ' вычитаем строку ' +
    (row + 1) +
    ', умноженную на соответствующий элемент в столбце ' +
    (column + 1) +
    '.<br>'
  DivRow(simplex, row, x)
  SubRows(simplex, row, column)
  return html
}
function IsBasisVar(simplex, index) {
  for (let i = 0; i < simplex.basis.length; i++)
    if (index == simplex.basis[i]) return true
  return false
}
function IsRowZero(simplex, row) {
  if (!simplex.b[row].isZero()) return false
  for (let j = 0; j < simplex.total; j++)
    if (!simplex.table[row][j].isZero()) return false
  return true
}
function IsColumnOne(simplex, column, row) {
  for (let i = 0; i < simplex.m; i++) {
    if (i != row && !simplex.table[i][column].isZero()) return false
    if (i == row && !simplex.table[i][column].isOne()) return false
  }
  return true
}
function GetIdentityColumn(simplex, row) {
  for (let j = 0; j < simplex.total; j++)
    if (IsColumnOne(simplex, j, row)) return j
  return -1
}
function RemoveZeroRow(simplex, row) {
  simplex.table.splice(row, 1)
  simplex.b.splice(row, 1)
  simplex.basis.splice(row, 1)
  simplex.basis.splice(row, 1)
  simplex.m--
}
function FindBasis(simplex) {
  if (InputStoreService.xo.length) {
    const arr = []
    InputStoreService.xo.forEach(el => arr.push(parseInt(el)))
    simplex.basis = arr
    return ''
  }
  let html = '<b>Ищем базис</b><br>'
  for (let i = 0; i < simplex.basis.length; i++) {
    // if (simplex.basis[i] > -1) continue
    let column = i
    simplex.basis[i] = column
    // if (column > -1) {
    //   html +=
    //     'В качестве базисной переменной ?<sub>' +
    //     -simplex.basis[i] +
    //     '</sub> берём x<sub>' +
    //     (column + 1) +
    //     '</sub>'
    //   html +=
    //     '. Делим строку ' +
    //     (i + 1) +
    //     ' на ' +
    //     simplex.table[i][column].print(printMode) +
    //     '.<br>'
    //   DivRow(simplex, i, simplex.table[i][column])
    //   simplex.basis[i] = column
    // } else {
    //   column = 0
    //   while (column < simplex.total) {
    //     if (IsBasisVar(simplex, column) || simplex.table[i][column].isZero()) {
    //       column++
    //     } else {
    //       break
    //     }
    //   }
    //   if (column == simplex.total) {
    //     if (IsRowZero(simplex, i)) {
    //       html +=
    //         'Условие ' +
    //         (i + 1) +
    //         ' линейно зависимо с другими условиями. Исключаем его из дальнейшего расмотрения.<br>'
    //       RemoveZeroRow(simplex, i)
    //       html += 'Обновлённая симплекс-таблица:'
    //       html += PrintTable(simplex)
    //       i--
    //       continue
    //     } else {
    //       html += '<br><b>Таблица:</b>'
    //       html += PrintTable(simplex)
    //       return (
    //         html +
    //         '<br>Обнаружено противоречивое условие. <b>Решение не существует</b>'
    //       )
    //     }
    //   }
    //   html += MakeVarBasis(simplex, i, column, true)
    // }
  }
  html += '<br><b>Таблица:</b>'
  html += PrintTable(simplex)
  html += '<br>'
  return html
}
function MaxAbsB(simplex) {
  let imax = -1
  for (let i = 0; i < simplex.m; i++) {
    if (!simplex.b[i].isNeg()) continue
    if (imax == -1 || simplex.b[i].abs().gt(simplex.b[imax].abs())) imax = i
  }
  return imax
}
function MaxAbsIndex(simplex, row) {
  let jmax = -1
  for (let j = 0; j < simplex.total; j++) {
    if (!simplex.table[row][j].isNeg()) continue
    if (
      jmax == -1 ||
      simplex.table[row][j].abs().gt(simplex.table[row][jmax].abs())
    )
      jmax = j
  }
  return jmax
}
function RemoveNegativeB(simplex) {
  let row = MaxAbsB(simplex)
  let column = MaxAbsIndex(simplex, row)
  let html = ''
  html +=
    'Максимальное по модулю |b|<sub>max</sub> = |' +
    simplex.b[row].print(printMode) +
    '| находится в строке ' +
    (row + 1) +
    '.<br>'
  if (column == -1) {
    html +=
      'В строке ' +
      (row + 1) +
      ' отсутстуют отрицательные значения. Решение задачи не существует.'
    return html
  }
  html +=
    'Максимальный по модулю элемент в строке ' +
    (row + 1) +
    ' = ' +
    simplex.table[row][column].print(printMode) +
    '  находится в столбце ' +
    (column + 1) +
    '.<br>'
  html += MakeVarBasis(simplex, row, column)
  html += '<br><b>Обновлённая таблица:</b>'
  html += PrintTable(simplex, row, column)
  return html
}
function HaveNegativeB(simplex) {
  for (let i = 0; i < simplex.m; i++) if (simplex.b[i].isNeg()) return true
  return false
}
function CheckSolveNegativeB(simplex) {
  let row = MaxAbsB(simplex)
  return MaxAbsIndex(simplex, row) > -1
}
function CalculateDeltas(simplex) {
  for (let j = 0; j < simplex.total; j++) {
    let delta = new Fraction('0')
    for (let i = 0; i < simplex.m; i++)
      delta = delta.add(simplex.C[simplex.basis[i]].mult(simplex.table[i][j]))
    simplex.deltas[j] = delta.sub(simplex.C[j])
  }
  let delta = new Fraction('0')
  for (let i = 0; i < simplex.m; i++)
    delta = delta.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]))
  simplex.deltas[simplex.total] = delta.sub(simplex.C[simplex.total])
}
function CalculateDeltasSolve(simplex) {
  let html = ''
  html += '&Delta;<sub>i</sub> = '
  for (let i = 0; i < simplex.m; i++) {
    html +=
      'C<sub>' + (1 + simplex.basis[i]) + '</sub>·a<sub>' + (i + 1) + 'i</sub>'
    if (i < simplex.m - 1) html += ' + '
  }
  html += ' - C<sub>i</sub><br>'
  let hint = ''
  for (let j = 0; j < simplex.total; j++) {
    let formula = '&Delta;<sub>' + (j + 1) + '</sub> = '
    let delta = ''
    for (let i = 0; i < simplex.m; i++) {
      formula +=
        'C<sub>' +
        (simplex.basis[i] + 1) +
        '</sub>·a<sub>' +
        (i + 1) +
        (j + 1) +
        '</sub>'
      delta +=
        simplex.C[simplex.basis[i]].print(printMode) +
        '·' +
        simplex.table[i][j].printNg(printMode)
      if (i < simplex.m - 1) {
        delta += ' + '
        formula += ' + '
      }
    }
    formula += ' - C<sub>' + (j + 1) + '</sub>'
    delta += ' - ' + simplex.C[j].print(printMode)
    delta += ' = ' + simplex.deltas[j].print(printMode)
    hint += formula + ' = ' + delta + '<br>'
  }
  let formula = '&Delta;<sub>b</sub> = '
  let delta = ''
  for (let i = 0; i < simplex.m; i++) {
    formula +=
      'C<sub>' + (simplex.basis[i] + 1) + '</sub>·b<sub>' + (i + 1) + '</sub>'
    delta +=
      simplex.C[simplex.basis[i]].print(printMode) +
      '·' +
      simplex.b[i].printNg(printMode)
    if (i < simplex.m - 1) {
      delta += ' + '
      formula += ' + '
    }
  }
  formula += ' - C<sub>' + (simplex.total + 1) + '</sub>'
  delta += ' - ' + simplex.C[simplex.total].print(printMode)
  delta += ' = ' + simplex.deltas[simplex.total].print(printMode)
  hint += formula + ' = ' + delta
  hint = CreateScrollBlock(hint)
  html += CreateHideOpenBlock('Подробный расчёт дельт', hint)
  return html
}
function CheckPlan(simplex) {
  if (InputStoreService.getSolveType() === 2) {
    for (let i = 0; i < simplex.basis.length; i++) {
      if (simplex.basis[i] >= simplex.n) {
        return false
      }
    }
  }
  for (let i = 0; i < simplex.total; i++) {
    if (simplex.mode == MAX && simplex.deltas[i].isNeg()) return false
    if (simplex.mode == MIN && simplex.deltas[i].isPos()) return false
  }
  return true
}
function CheckPlanSolve(simplex) {
  let hint = ''
  // let hint = CreateHideOpenBlock(
  //   'Критерий оптимальности',
  //   'План оптимален, если в таблице отсутствуют ' +
  //     (simplex.mode == MAX ? 'отрицательные' : 'положительные') +
  //     ' дельты. '
  // )
  let html = '<b>Проверяем план на оптимальность:</b> '
  if (InputStoreService.getSolveType() === 2) {
    for (let i = 0; i < simplex.basis.length; i++) {
      if (simplex.basis[i] >= simplex.n) {
        html += 'Таблица содержит искуственные переменные, продолжаем решение.'
        return html
      }
    }
  }
  for (let i = 0; i < simplex.total; i++) {
    if (simplex.mode == MAX && simplex.deltas[i].isNeg()) {
      html +=
        'план <b>не оптимален</b>, так как &Delta;<sub>' +
        (i + 1) +
        '</sub> = ' +
        simplex.deltas[i].print(printMode) +
        ' отрицательна.<br>'
      html += hint
      return html
    }
    if (simplex.mode == MIN && simplex.deltas[i].isPos()) {
      html +=
        'план <b>не оптимален</b>, так как &Delta;<sub>' +
        (i + 1) +
        '</sub> = ' +
        simplex.deltas[i].print(printMode) +
        ' положительна.<br>'
      html += hint
      return html
    }
  }
  html +=
    (simplex.mode == MAX ? 'отрицательные' : 'положительные') +
    ' дельты отсутствуют, следовательно <b>план оптимален</b>.<br>'
  html += hint
  return html
}
function GetColumn(simplex) {
  let jmax = 0
  for (let j = 1; j < simplex.total; j++) {
    if (simplex.mode == MAX && simplex.deltas[j].lt(simplex.deltas[jmax]))
      jmax = j
    else if (simplex.mode == MIN && simplex.deltas[j].gt(simplex.deltas[jmax]))
      jmax = j
  }
  return jmax
}
function GetColumn2(simplex) {
  let jmax = 0
  for (let j = 1; j < simplex.total; j++) {
    if (simplex.mode == MAX && simplex.fn[j].lt(simplex.fn[jmax])) jmax = j
    else if (simplex.mode == MIN && simplex.fn[j].gt(simplex.fn[jmax])) jmax = j
  }
  return jmax
}
function GetQandRow(simplex, j) {
  let imin = -1
  for (let i = 0; i < simplex.m; i++) {
    simplex.Q[i] = null
    if (simplex.table[i][j].isZero()) continue
    let q = simplex.b[i].div(simplex.table[i][j])
    if (q.isNeg() || (simplex.b[i].isZero() && simplex.table[i][j].isNeg()))
      continue
    simplex.Q[i] = q
    if (imin == -1 || q.lt(simplex.Q[imin])) imin = i
  }
  return imin
}
function DivRow(simplex, row, value) {
  for (let j = 0; j < simplex.total; j++)
    simplex.table[row][j] = simplex.table[row][j].div(value)
  simplex.b[row] = simplex.b[row].div(value)
}
function SubRow(simplex, row1, row2, value) {
  for (let j = 0; j < simplex.total; j++)
    simplex.table[row1][j] = simplex.table[row1][j].sub(
      simplex.table[row2][j].mult(value)
    )
  simplex.b[row1] = simplex.b[row1].sub(simplex.b[row2].mult(value))
}
function SubRows(simplex, row, column) {
  for (let i = 0; i < simplex.m; i++) {
    if (i == row) continue
    SubRow(simplex, i, row, simplex.table[i][column])
  }
}
function CalcFunction(simplex) {
  let F = new Fraction()
  let X = []
  let html = ''
  for (let i = 0; i < simplex.m; i++)
    F = F.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]))
  for (let i = 0; i < simplex.basis.length + simplex.row.length; i++) {
    html += simplex.C[i].print(printMode) + '·'
    let index = simplex.basis.indexOf(i)
    if (index == -1) {
      html += '0 '
      X.push('0')
    } else {
      html += simplex.b[index].printNg(printMode) + ' '
      X.push(simplex.b[index].print(printMode))
    }
    if (i < simplex.basis.length + simplex.row.length - 1) html += '+ '
  }
  return { result: F, plan: '[ ' + X.join(', ') + ' ]', solve: html }
}
function PrintTable(simplex, row = -1, col = -1) {
  let html = '<br>'
  let n = simplex.n
  html += "<table class='simplex-table'>"
  // html += '<tr><td><b>C</b></td>'
  // for (let i = 0; i < simplex.C.length; i++)
  //   html += '<td>' + simplex.C[i].print(printMode) + '</td>'
  // html += '</tr>'
  html += '<tr><th>базис</th>'
  for (let i = 0; i < simplex.row.length; i++)
    html += '<th>x<sub>' + (simplex.row[i] + 1) + '</sub></th>'
  html += '<th>b</th>'
  if (simplex.Q.length > 0) html += '<th>Q</th>'
  html += '</tr>'
  for (let i = 0; i < simplex.m; i++) {
    if (simplex.basis[i] < 0)
      html += '<tr><td><b>?<sub>' + -simplex.basis[i] + '</sub></b></td>'
    else
      html +=
        '<tr><td><b>x<sub>' +
        (1 + parseInt(simplex.basis[i], 10)) +
        '</sub></b></td>'
    for (let j = 0; j < simplex.table[i].length; j++) {
      if (i == row && j == col) html += "<td class='row-col-cell'>"
      else if (i == row) html += "<td class='row-cell'>"
      else if (j == col) html += "<td class='col-cell'>"
      else html += '<td>'
      html += simplex.table[i][j].print(printMode)
      html += '</td>'
    }
    if (i == row) html += "<td class='row-cell'>"
    else html += '<td>'
    html += simplex.b[i].print(printMode) + '</td>'
    if (simplex.Q.length > 0) {
      if (simplex.Q[i] == null) html += '<td>-</td>'
      else if (col != -1) {
        html +=
          '<td' +
          (i == row ? " class='row-cell'" : '') +
          '>' +
          simplex.b[i].print(printMode) +
          ' / ' +
          simplex.table[i][col].print(printMode) +
          ' = ' +
          simplex.Q[i].print(printMode) +
          '</td>'
      } else {
        html += '<td>' + simplex.Q[i].print(printMode) + '</td>'
      }
    }
    html += '</tr>'
  }
  // if(simplex.fn.length > 0){
  //   html += '<tr><td><b>p</b></td>'
  //   for (let i = 0; i < simplex.fn.length; i++)
  //     html += '<td>' + simplex.fn[i].print(printMode) + '</td>'
  //   html += '</tr>'
  // }
  if (simplex.deltas.length > 0) {
    html += '<tr><td><b>&Delta;</b></td>'
    for (let i = 0; i < simplex.deltas.length; i++)
      html += '<td>' + simplex.deltas[i].print(printMode) + '</td>'
    html += '</tr>'
  }
  html += '</table>'
  html += '<br>'
  return html
}
function PrintAnswer(simplex) {
  let answer = ''
  for (let i = 0; i < simplex.basis.length + simplex.row.length; i++) {
    // debugger
    let index = simplex.basis.indexOf(i)
    answer += 'x<sub>' + (i + 1) + '</sub> = '
    if (index == -1) answer += '0, '
    else answer += simplex.b[index].print(printMode) + ', '
  }
  let F = new Fraction()
  for (let i = 0; i < simplex.m; i++)
    F = F.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]))
  answer += 'F = ' + F.print(printMode)
  return answer
}
function SolveTable(n, m, func, restricts, mode, html) {
  html.innerHTML = ''
  let init = PrepareTable(n, m, func, restricts, mode)
  html.innerHTML += init.html
  let simplex = init.simplex
  // html.innerHTML += '<b>Начальная симплекс-таблица</b>'
  if (InputStoreService.getSolveType() === 2) {
    html.innerHTML += PrintTable(simplex)
  }
  let res = true
  if (!CheckBasis(simplex)) html.innerHTML += FindBasis(simplex, html)
  if (!CheckBasis(simplex)) {
    window['answer'] = 'Решение задачи не существует.'
    html.innerHTML = 'Решение задачи не существует'
    return
  }
  // while (HaveNegativeB(simplex) && res) {
  //   html.innerHTML += 'В столбце b присутствуют отрицательные значения.<br>'
  //   res = CheckSolveNegativeB(simplex)
  //   html.innerHTML += RemoveNegativeB(simplex)
  // }
  // if (!res) {
  //   window['answer'] = 'Решение задачи не существует.'
  //   return
  // }
  CalculateDeltas(simplex)
  html.innerHTML += '<b>Вычисляем дельты:</b> '
  html.innerHTML += CalculateDeltasSolve(simplex)
  html.innerHTML += '<b>Симплекс-таблица с дельтами</b>'
  html.innerHTML += PrintTable(simplex)
  let iteration = 1
  html.innerHTML += CheckPlanSolve(simplex)
  // step(simplex, html, iteration)
  window['iteration'] = iteration
  window['simplex'] = simplex
  window['html'] = html
  window['n'] = n
  window['m'] = m
  window['func'] = func
  window['restricts'] = restricts
  window['mode'] = mode

  if (!InputStoreService.getAutoselect()) {
    const sInput = document.createElement('input')
    sInput.setAttribute('type', 'text')
    sInput.placeholder = 'column'
    sInput.id = `column_${iteration}`
    html.appendChild(sInput)

    const fInput = document.createElement('input')
    fInput.setAttribute('type', 'text')
    fInput.placeholder = 'row'
    fInput.id = `row_${iteration}`
    html.appendChild(fInput)
  }
  let simplexStore = []
  window['simplexStore'] = simplexStore
  window.simplexStore.push(clonedeep(simplex))

  if (InputStoreService.getSolution()) {
    html.innerHTML +=
      '<button onclick="window.step(simplex, html, iteration)">Continue</button>'
  } else {
    step(simplex, html, iteration)
  }
}
function onBack(html, iteration) {
  if (iteration <= 2) {
    if (iteration === 2) {
      SolveTable(
        window.n,
        window.m,
        window.func,
        window.restricts,
        window.mode,
        window.html
      )
    }
    return
  }
  iteration -= 2
  window.simplexStore.pop()
  const current = window.simplexStore[window.simplexStore.length - 1]
  window.simplex = current
  window.step(current, html, iteration)
}
function step(simplex, html, iteration) {
  if (!CheckPlan(simplex)) {
    window.simplexStore.push(clonedeep(simplex))
    let column = GetColumn(simplex, iteration)
    let row = GetQandRow(simplex, column, iteration)
    if (!InputStoreService.getAutoselect()) {
      column =
        parseInt(document.getElementById(`column_${iteration}`).value, 10) - 1
      row = parseInt(document.getElementById(`row_${iteration}`).value, 10) - 1
    }

    html.innerHTML += '<h3>Итерация ' + iteration + '</h3>'
    html.innerHTML +=
      'Определяем <i>разрешающий столбец</i> - столбец, в котором находится '
    html.innerHTML +=
      (simplex.mode == MAX ? 'минимальная' : 'максимальная') + ' дельта: '
    html.innerHTML +=
      column +
      1 +
      ', &Delta;<sub>' +
      (column + 1) +
      '</sub>: ' +
      simplex.deltas[column].print(printMode) +
      '<br>'
    html.innerHTML +=
      'Находим симплекс-отношения Q, путём деления коэффициентов b на соответствующие значения столбца ' +
      (column + 1) +
      '<br>'

    if (row == -1) {
      html.innerHTML += PrintTable(simplex, -1, column)
      html.innerHTML +=
        'Все значения столбца ' + (column + 1) + ' неположительны.<br>'
      html.innerHTML +=
        '<b>Функция не ограничена. Оптимальное решение отсутствует</b>.<br>'
      window['answer'] =
        'Функция не ограничена. Оптимальное решение отсутствует.'
      return
    }
    html.innerHTML +=
      'В найденном столбце ищем строку с наименьшим значением Q: Q<sub>min</sub> = ' +
      simplex.Q[row].print(printMode) +
      ', строка ' +
      (row + 1) +
      '.<br>'
    html.innerHTML +=
      'На пересечении найденных строки и столбца находится <i>разрешающий элемент</i>: ' +
      simplex.table[row][column].print(printMode) +
      '<br>'
    html.innerHTML += MakeVarBasis(simplex, row, column, true)
    if (
      InputStoreService.getSolveType() === 1 ||
      simplex.row[column] < simplex.n
    ) {
      CalculateDeltas(simplex)
      html.innerHTML += '<b>Вычисляем новые дельты:</b> '
      html.innerHTML += CalculateDeltasSolve(simplex)
      html.innerHTML += '<b>Симплекс-таблица с обновлёнными дельтами</b>'
      html.innerHTML += PrintTable(simplex)
    }

    if (InputStoreService.getSolveType() === 2) {
      if (simplex.row[column] >= simplex.n) {
        html.innerHTML += '<b>Исключаем текущий столбец</b>'
        for (let i = 0; i < simplex.table.length; i++) {
          simplex.table[i].splice(column, 1)
        }
        simplex.deltas.splice(column, 1)
        simplex.row.splice(column, 1)
        simplex.total--
        html.innerHTML += PrintTable(simplex)
      }
    }

    let F = CalcFunction(simplex)
    // html.innerHTML += '<b>Текущий план X:</b> ' + F.plan + '<br>'
    html.innerHTML +=
      '<b>Целевая функция F:</b> ' +
      F.solve +
      ' = ' +
      F.result.print(printMode) +
      '<br>'
    iteration++
    html.innerHTML += CheckPlanSolve(simplex)
    const button = document.createElement('button')
    window['iteration'] = iteration
    window['simplex'] = simplex
    window['html'] = html

    if (!InputStoreService.getAutoselect()) {
      const sInput = document.createElement('input')
      sInput.setAttribute('type', 'text')
      sInput.placeholder = 'column'
      sInput.id = `column_${iteration}`
      html.appendChild(sInput)

      const fInput = document.createElement('input')
      fInput.setAttribute('type', 'text')
      fInput.placeholder = 'row'
      fInput.id = `row_${iteration}`
      html.appendChild(fInput)
    }

    // html.innerHTML += '<input type="text"> i </input>'
    // html.innerHTML += '<input type="text"> j </input>'
    if (InputStoreService.getSolution()) {
      html.innerHTML +=
        '<button onclick="window.step(simplex, html, iteration)">Continue</button>'
      html.innerHTML +=
        '<button onclick="window.onBack(html, iteration)">Back</button>'
    } else {
      step(simplex, html, iteration)
    }
  } else {
    if (HaveNegativeB(simplex)) {
      html.innerHTML +=
        'В столбце b присутствуют отрицательные значения. Решения не существует.'
      window['answer'] =
        'В столбце b присутствуют отрицательные значения. Решения не существует.'
      return
    }

    let answer = PrintAnswer(simplex)
    html.innerHTML += '<b>Ответ:</b> ' + answer
    window['answer'] = answer
  }
}
function Solve() {
  let solveBox = document.getElementById('simplex-solve')
  let n = InputStoreService.getMaxX()
  let m = InputStoreService.getRowCount()
  let mode = InputStoreService.getMode()
  let func = InputStoreService.getFuncArray()
  let restricts = InputStoreService.getValueArray()
  printMode = InputStoreService.getFraction() ? 1 : 2
  solveBox.innerHTML = '<h3>Введённые данные</h3>'
  solveBox.innerHTML += "<div class='scroll-block'>"
  solveBox.innerHTML += PrintFunction(func)
  solveBox.innerHTML += '&rarr; ' + mode
  solveBox.innerHTML += '<br>'
  for (let i = 0; i < m; i++) {
    solveBox.innerHTML += PrintFunction(restricts[i].values)
    solveBox.innerHTML += ' ' + restricts[i].sign + ' '
    solveBox.innerHTML += restricts[i].b.print(printMode)
    solveBox.innerHTML += '<br>'
  }
  solveBox.innerHTML += '</div>'
  if (InputStoreService.getSolution()) {
    SolveTable(n, m, func, restricts, mode, solveBox)
  } else {
    const div = document.createElement('div')
    SolveTable(n, m, func, restricts, mode, div)
    solveBox.innerHTML += '<h3>Ответ</h3>' + window.answer
  }
}

export const init = () => {
  window.Solve = Solve
  window.step = step
  window.onBack = onBack
}
window.Solve = Solve
