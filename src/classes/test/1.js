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
  ;[func, restricts, mode] = PrepareData(func, restricts, mode)
  const res = []
  let k = 0
  if (InputStoreService.getSolveType() === 2) {
    k = m
  }
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
    tableVersion: 0,
  }
  let html = ''
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

  for (let i = 0; i < n; i++) simplex.C.push(func[i])
  for (let i = 0; i < k; i++) simplex.C.push(new Fraction())
  simplex.C.push(new Fraction('0'))
  let findHtml = ''

  let index = 0
  let basisHtml = []
  let systemHtml = ''
  let pasteIndex = 0
  for (let i = 0; i < m; i++) {
    simplex.table[i] = []
    for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j])
    let inserted = false
    simplex.b[i] = restricts[i].b
    systemHtml +=
      PrintFunction(simplex.table[i]) +
      ' = ' +
      simplex.b[i].print(printMode) +
      '<br>'
  }
  if (InputStoreService.getSolveType() === 1) {
    for (let i = 0; i < m; i++) {
      simplex.basis[i] = i
    }
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
      }
    } else {
      for (let i = 0; i < m; i++) {
        simplex.basis.push(simplex.n + i)
      }
      for (let i = 0; i < restricts[0].values.length; i++) {
        simplex.row.push(i)
      }
    }
  }

  if (InputStoreService.getSolveType() === 1) {
    const copy = []
    restricts.forEach(el => copy.push([...el.values, el.b]))
    const gauss = Iteration(
      restricts.length,
      copy,
      restricts.length,
      InputStoreService.xo
    )
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
  return { simplex: simplex, html: html }
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
function HaveNegativeB(simplex) {
  for (let i = 0; i < simplex.m; i++) if (simplex.b[i].isNeg()) return true
  return false
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
  let html = '<b>Проверяем план на оптимальность:</b> '
  if (InputStoreService.getSolveType() === 2) {
    for (let i = 0; i < simplex.basis.length; i++) {
      if (simplex.basis[i] >= simplex.n) {
        html +=
          '<div>Таблица содержит искуственные переменные, продолжаем решение.</div>'
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
  simplex.tableVersion++
  let html = '<br>'
  let n = simplex.n
  const id = simplex.tableVersion
  html +=
    "<table class='simplex-table' onclick='window.onTableCick(event, this)' id='tb" +
    simplex.tableVersion +
    "'>"
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
  CalculateDeltas(simplex)
  html.innerHTML += '<b>Вычисляем дельты:</b> '
  html.innerHTML += CalculateDeltasSolve(simplex)
  html.innerHTML += '<b>Симплекс-таблица с дельтами</b>'
  html.innerHTML += PrintTable(simplex)
  let iteration = 1
  html.innerHTML += CheckPlanSolve(simplex)
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
  if(CheckPlan(simplex)){
    step(simplex, html, iteration)
    return
  }
  if (InputStoreService.getSolution()) {
    const button = document.createElement('button')
    button.className = 'button'
    button.textContent = 'Продолжить'
    button.addEventListener('click', () => {
      button.disabled = true
      window.step(simplex, html, iteration)
    })
    button.id = `button_${iteration}`
    html.appendChild(button)
  } else {
    step(simplex, html, iteration)
  }
}
function onBack(html, iteration) {
  if (iteration <= 2) {
    if (iteration === 2) {
      let solveBox = document.getElementById('simplex-solve')
      let n = InputStoreService.getMaxX()
      let m = InputStoreService.getRowCount()
      let mode = InputStoreService.getMode()
      let func = InputStoreService.getFuncArray()
      let restricts = InputStoreService.getValueArray()
      SolveTable(n, m, func, restricts, mode, solveBox)
    }
    return
  }
  iteration -= 2
  window.simplexStore.pop()
  const current = window.simplexStore[window.simplexStore.length - 1]
  window.simplex = current
  // const start = document.getElementById(`div_${iteration + 1}`)
  // let del = false
  // const children = start.parentNode.children
  // for (let i = 0; ; ) {
  //   if (!children[i]) {
  //     break
  //   }
  //   if (!del && children[i] == start) {
  //     del = true
  //   }
  //   if (del) {
  //     children[i].remove()
  //     continue
  //   }
  //   i++
  // }
  window.step(current, html, iteration)
}
function step(
  simplex,
  html,
  iteration,
  selectedRow = null,
  selectedColumn = null
) {
  if (!CheckPlan(simplex)) {
    window.simplexStore.push(clonedeep(simplex))
    let column = GetColumn(simplex, iteration)
    let row = GetQandRow(simplex, column, iteration)

    if (selectedRow !== null && selectedColumn !== null) {
      row = selectedRow
      column = selectedColumn
    }

    if (!InputStoreService.getAutoselect()) {
      column =
        parseInt(document.getElementById(`column_${iteration}`).value, 10) - 1
      row = parseInt(document.getElementById(`row_${iteration}`).value, 10) - 1
    }
    html.innerHTML += '<div id=' + `div_${iteration}` + '></div>'
    html.innerHTML += '<h3>Итерация ' + iteration + '</h3>'
    if (selectedRow === null || selectedColumn === null) {
      html.innerHTML +=
        '<span>Определяем <i>разрешающий столбец</i> - столбец, в котором находится'
      html.innerHTML +=
        (simplex.mode == MAX ? 'минимальная' : 'максимальная') + ' дельта: '
      html.innerHTML +=
        column +
        1 +
        ', &Delta;<sub>' +
        (column + 1) +
        '</sub>: ' +
        simplex.deltas[column].print(printMode) +
        '</span><br>'
    } else {
      html.innerHTML += 'Выбранный разрешающий столбец: ' + `${column + 1}<br>`
    }
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
    if (selectedRow === null || selectedColumn === null) {
      html.innerHTML +=
        'В найденном столбце ищем строку с наименьшим значением Q: Q<sub>min</sub> = ' +
        simplex.Q[row].print(printMode) +
        ', строка ' +
        (row + 1) +
        '.<br>'
    } else {
      html.innerHTML += 'Выбранная разрешающая строка: ' + `${row + 1}<br>`
    }
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
    html.innerHTML +=
      '<b>Целевая функция F:</b> ' +
      F.solve +
      ' = ' +
      F.result.print(printMode) +
      '<br>'
    iteration++
    html.innerHTML += CheckPlanSolve(simplex)
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
    if (CheckPlan(simplex)) {
      window.done = true
      step(simplex, html, iteration)
      return
    }
    if (InputStoreService.getSolution()) {
      const div = document.createElement('div')
      let button, button2
      button = document.createElement('button')
      button.className = 'button'
      button.textContent = 'Продолжить'
      button.addEventListener('click', () => {
        button.disabled = true
        button2.disabled = true
        window.step(simplex, html, iteration)
      })
      button.id = `button_${iteration}`

      button2 = document.createElement('button')
      button2.className = 'button'
      button2.textContent = 'Назад'
      button2.addEventListener('click', () => {
        button2.disabled = true
        button.disabled = true
        window.onBack(html, iteration)
      })
      button2.id = `button2_${iteration}`
      div.appendChild(button)
      div.appendChild(button2)
      html.appendChild(div)
    } else {
      step(simplex, html, iteration)
    }
  } else {
    window.done = true
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
  window.done = false
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
function onTableClick(e, table) {
  try {
    if (window.done) {
      return
    }
    const tbAvailableWidthIndex = window.simplex.table[0].length + 1
    const tbAvailableHeightIndex = window.simplex.table.length + 1
    const rIndex = e.target.closest('tr').rowIndex
    const cIndex = e.target.cellIndex
    if (
      window.simplex.tableVersion == table.id.replace('tb', '') &&
      rIndex > 0 &&
      rIndex < tbAvailableHeightIndex &&
      cIndex > 0 &&
      cIndex < tbAvailableWidthIndex
    ) {
      if (e.target.innerText <= 0) {
        return
      }
      const simplexColIndex = cIndex - 1
      const simplexRowIndex = rIndex - 1
      let min
      for (let i = 0; i < window.simplex.table.length; i++) {
        const value = window.simplex.b[simplexRowIndex].div(
          window.simplex.table[i][simplexColIndex]
        )
        if (value.isNeg()) {
          continue
        }
        if (!min || value.lt(min)) {
          min = value
        }
      }
      let div = window.simplex.b[simplexRowIndex].div(
        window.simplex.table[simplexRowIndex][simplexColIndex]
      )
      if (div.eq(min)) {
        window.step(
          window.simplex,
          window.html,
          window.iteration,
          simplexRowIndex,
          simplexColIndex
        )
        for (let i = 1; i < window.iteration; i++) {
          let button = document.getElementById(`button_${i}`)
          if (button) {
            button.disabled = true
          }
          button = document.getElementById(`button2_${i}`)
          if (button) {
            button.disabled = true
          }
        }
      }
    }
  } catch (e) {
    return
  }
}

export const init = () => {
  window.Solve = Solve
  window.step = step
  window.onBack = onBack
  window.onTableCick = onTableClick
}
window.Solve = Solve
