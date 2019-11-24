import InputStoreService from '../services/InputStoreService'
import { Fraction } from './FractionsHelper'
import { bigInt } from './BigInt'

const LE = '≤'
const EQ = '='
const GE = '≥'
const MAX = 'max'
const MIN = 'min'
const NEGATIVE_BASIS = false
let NEED_LOGS = true
const GENERATE_SAMPLES = false
let solveBox = document.getElementById('simplex-solve')
let printMode = 1
let resultAnswer = null
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
function ChangeSigns(restricts) {
  let html =
    '<b>Меняем знаки у ограничений с ' + GE + ', путём умножения на -1:</b><br>'
  let have = false
  for (let i = 0; i < restricts.length; i++) {
    if (restricts[i].sign == GE) {
      restricts[i].sign = LE
      for (let j = 0; j < restricts[i].values.length; j++)
        restricts[i].values[j].changeSign()
      restricts[i].b.changeSign()
      have = true
    }
    html += PrintFunction(restricts[i].values)
    html += ' ' + restricts[i].sign + ' '
    html += restricts[i].b.print(printMode)
    html += '<br>'
  }
  html += '<br>'
  return have ? html : ''
}
function PrepareTable(n, m, func, restricts, mode) {
  let k = 0
  for (let i = 0; i < restricts.length; i++) if (restricts[i].sign != EQ) k++
  let simplex = {
    n: n,
    m: m,
    total: n + k,
    mode: mode,
    table: [],
    b: [],
    basis: [],
    C: [],
    deltas: [],
    Q: [],
  }
  let html = ''
  if (k > 2) {
    html +=
      'Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub>..x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 2) {
    html +=
      'Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub> и x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 1) {
    html +=
      'Для ограничения с неравенством <b>добавляем дополнительную переменную</b> x<sub>' +
      (n + 1) +
      '</sub>.<br>'
  }
  for (let i = 0; i < n; i++) simplex.C.push(func[i])
  for (let i = 0; i < k; i++) simplex.C.push(new Fraction())
  simplex.C.push(new Fraction('0'))
  let findHtml = '<b>Ищем начальное базисное решение:</b><br>'
  let index = 0
  let unknown = -1
  let basisHtml = []
  let systemHtml = ''
  for (let i = 0; i < m; i++) {
    simplex.table[i] = []
    for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j])
    let inserted = false
    if (restricts[i].sign == EQ) {
      simplex.basis.push(unknown)
      unknown--
      basisHtml[simplex.basis.length - 1] =
        'Ограничение ' +
        (i + 1) +
        ' содержит равенство. Базисная переменная для этого ограничения будет определена позднее.<br>'
    } else if (NEGATIVE_BASIS && restricts[i].sign == GE) {
      simplex.basis.push(unknown)
      unknown--
      basisHtml[simplex.basis.length - 1] =
        'Ограничение ' +
        (i + 1) +
        ' содержит неравенство с ' +
        GE +
        '. Базисная переменная для этого ограничения будет определена позднее.<br>'
    }
    for (let j = 0; j < k; j++) {
      if (restricts[i].sign == EQ) {
        simplex.table[i].push(new Fraction('0'))
      } else if (!NEGATIVE_BASIS || restricts[i].sign == LE) {
        if (j != index || inserted) {
          simplex.table[i].push(new Fraction('0'))
        } else if (!inserted) {
          simplex.table[i].push(new Fraction('1'))
          simplex.basis.push(n + index)
          basisHtml[simplex.basis.length - 1] =
            'Ограничение ' +
            (i + 1) +
            ' содержит неравенство, базисной будет добавленная дополнительная переменная x<sub>' +
            (n + index + 1) +
            '</sub><br>'
          index++
          inserted = true
        }
      } else if (NEGATIVE_BASIS) {
        if (j != index || inserted) {
          simplex.table[i].push(new Fraction('0'))
        } else if (!inserted) {
          simplex.table[i].push(new Fraction('-1'))
          index++
          inserted = true
        }
      }
    }
    simplex.b[i] = restricts[i].b
    systemHtml +=
      PrintFunction(simplex.table[i]) +
      ' = ' +
      simplex.b[i].print(printMode) +
      '<br>'
  }
  unknown = -1
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
  if (k > 0) {
    html += 'Перепишем ограничения в каноническом виде:<br>'
    html += systemHtml + '<br>'
  }
  html += findHtml + basisHtml.join('') + '<br>'
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
      (column + 1) +
      '</sub>.<br>'
  simplex.basis[row] = column
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
function IsColumnBasis(simplex, column, row) {
  for (let i = 0; i < simplex.m; i++) {
    if (i != row && !simplex.table[i][column].isZero()) return false
    if (i == row && simplex.table[i][column].isZero()) return false
  }
  return true
}
function GetIdentityColumn(simplex, row) {
  for (let j = 0; j < simplex.total; j++)
    if (IsColumnOne(simplex, j, row)) return j
  return -1
}
function GetBasisColumn(simplex, row) {
  for (let j = 0; j < simplex.total; j++)
    if (IsColumnBasis(simplex, j, row)) return j
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
  let html = '<b>Ищем базис</b><br>'
  for (let i = 0; i < simplex.basis.length; i++) {
    if (simplex.basis[i] > -1) continue
    let column = GetBasisColumn(simplex, i)
    if (column > -1) {
      html +=
        'В качестве базисной переменной ?<sub>' +
        -simplex.basis[i] +
        '</sub> берём x<sub>' +
        (column + 1) +
        '</sub>'
      html +=
        '. Делим строку ' +
        (i + 1) +
        ' на ' +
        simplex.table[i][column].print(printMode) +
        '.<br>'
      DivRow(simplex, i, simplex.table[i][column])
      simplex.basis[i] = column
    } else {
      column = 0
      while (column < simplex.total) {
        if (IsBasisVar(simplex, column) || simplex.table[i][column].isZero()) {
          column++
        } else {
          break
        }
      }
      if (column == simplex.total) {
        if (IsRowZero(simplex, i)) {
          html +=
            'Условие ' +
            (i + 1) +
            ' линейно зависимо с другими условиями. Исключаем его из дальнейшего расмотрения.<br>'
          RemoveZeroRow(simplex, i)
          html += 'Обновлённая симплекс-таблица:'
          html += PrintTable(simplex)
          i--
          continue
        } else {
          html += '<br><b>Таблица:</b>'
          html += PrintTable(simplex)
          return (
            html +
            '<br>Обнаружено противоречивое условие. <b>Решение не существует</b>'
          )
        }
      }
      html += MakeVarBasis(simplex, i, column, true)
    }
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
  for (let i = 0; i < simplex.total; i++) {
    if (simplex.mode == MAX && simplex.deltas[i].isNeg()) return false
    if (simplex.mode == MIN && simplex.deltas[i].isPos()) return false
  }
  return true
}
function CheckPlanSolve(simplex) {
  let hint = CreateHideOpenBlock(
    'Критерий оптимальности',
    'План оптимален, если в таблице отсутствуют ' +
      (simplex.mode == MAX ? 'отрицательные' : 'положительные') +
      ' дельты. '
  )
  let html = '<b>Проверяем план на оптимальность:</b> '
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
  if (InputStoreService.getAutoselect()) {
    for (let j = 1; j < simplex.total; j++) {
      if (simplex.mode == MAX && simplex.deltas[j].lt(simplex.deltas[jmax]))
        jmax = j
      else if (
        simplex.mode == MIN &&
        simplex.deltas[j].gt(simplex.deltas[jmax])
      )
        jmax = j
    }
  }
  return jmax
}
function GetQandRow(simplex, j) {
  let imin = -1
  if (InputStoreService.getAutoselect()) {
    for (let i = 0; i < simplex.m; i++) {
      simplex.Q[i] = null
      if (simplex.table[i][j].isZero()) continue
      let q = simplex.b[i].div(simplex.table[i][j])
      if (q.isNeg() || (simplex.b[i].isZero() && simplex.table[i][j].isNeg()))
        continue
      simplex.Q[i] = q
      if (imin == -1 || q.lt(simplex.Q[imin])) imin = i
    }
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
  for (let i = 0; i < simplex.total; i++) {
    html += simplex.C[i].print(printMode) + '·'
    let index = simplex.basis.indexOf(i)
    if (index == -1) {
      html += '0 '
      X.push('0')
    } else {
      html += simplex.b[index].printNg(printMode) + ' '
      X.push(simplex.b[index].print(printMode))
    }
    if (i < simplex.total - 1) html += '+ '
  }
  return { result: F, plan: '[ ' + X.join(', ') + ' ]', solve: html }
}
function PrintTable(simplex, row = -1, col = -1) {
  let html = '<br>'
  let n = simplex.n
  html += "<table class='simplex-table'>"
  html += '<tr><td><b>C</b></td>'
  for (let i = 0; i < simplex.C.length; i++)
    html += '<td>' + simplex.C[i].print(printMode) + '</td>'
  html += '</tr>'
  html += '<tr><th>базис</th>'
  for (let i = 0; i < simplex.total; i++)
    html += '<th>x<sub>' + (i + 1) + '</sub></th>'
  html += '<th>b</th>'
  if (simplex.Q.length > 0) html += '<th>Q</th>'
  html += '</tr>'
  for (let i = 0; i < simplex.m; i++) {
    if (simplex.basis[i] < 0)
      html += '<tr><td><b>?<sub>' + -simplex.basis[i] + '</sub></b></td>'
    else
      html += '<tr><td><b>x<sub>' + (1 + simplex.basis[i]) + '</sub></b></td>'
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
  for (let i = 0; i < simplex.n; i++) {
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
function InputToString(func, mode, restrictions) {
  let s = 'f: '
  for (let i = 0; i < func.length; i++) s += func[i].toString() + ' '
  s += mode + ' '
  for (let i = 0; i < restrictions.length; i++) {
    s += ', rest ' + (i + 1) + ': ['
    for (let j = 0; j < restrictions[i].values.length; j++) {
      s += restrictions[i].values[j].toString() + ' '
    }
    s += restrictions[i].sign + ' ' + restrictions[i].b.toString() + ']'
  }
  return s
}
function SolveTable(n, m, func, restricts, mode, html) {
  html.innerHTML = ''
  // let html = ''
  if (!NEGATIVE_BASIS) html.innerHTML += ChangeSigns(restricts)
  let init = PrepareTable(n, m, func, restricts, mode)
  html.innerHTML += init.html
  let simplex = init.simplex
  html.innerHTML += '<b>Начальная симплекс-таблица</b>'
  html.innerHTML += PrintTable(simplex)
  let res = true
  if (!CheckBasis(simplex)) html.innerHTML += FindBasis(simplex)
  if (!CheckBasis(simplex)) {
    return { answer: 'Решение задачи не существует.', solve: html }
  }
  while (HaveNegativeB(simplex) && res) {
    html.innerHTML += 'В столбце b присутствуют отрицательные значения.<br>'
    res = CheckSolveNegativeB(simplex)
    html.innerHTML += RemoveNegativeB(simplex)
  }
  if (!res) {
    return { answer: 'Решение задачи не существует.', solve: html }
  }
  CalculateDeltas(simplex)
  html.innerHTML += '<b>Вычисляем дельты:</b> '
  html.innerHTML += CalculateDeltasSolve(simplex)
  html.innerHTML += '<b>Симплекс-таблица с дельтами</b>'
  html.innerHTML += PrintTable(simplex)
  let iteration = 1
  html.innerHTML += CheckPlanSolve(simplex)
  step(simplex, html, iteration)
}

function onClick() {
  console.log('hey')
}

function step(simplex, html, iteration) {
  if (!CheckPlan(simplex)) {
    html.innerHTML += '<h3>Итерация ' + iteration + '</h3>'
    let column = GetColumn(simplex)
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
    let row = GetQandRow(simplex, column)
    if (row == -1) {
      html.innerHTML += PrintTable(simplex, -1, column)
      html.innerHTML +=
        'Все значения столбца ' + (column + 1) + ' неположительны.<br>'
      html.innerHTML +=
        '<b>Функция не ограничена. Оптимальное решение отсутствует</b>.<br>'
      return {
        answer: 'Функция не ограничена. Оптимальное решение отсутствует.',
        solve: html,
      }
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
    CalculateDeltas(simplex)
    html.innerHTML += '<b>Вычисляем новые дельты:</b> '
    html.innerHTML += CalculateDeltasSolve(simplex)
    html.innerHTML += '<b>Симплекс-таблица с обновлёнными дельтами</b>'
    html.innerHTML += PrintTable(simplex)
    let F = CalcFunction(simplex)
    html.innerHTML += '<b>Текущий план X:</b> ' + F.plan + '<br>'
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
    html.innerHTML += '<button onclick="window.step(simplex, html, iteration)">Continue</button>'
  }
  else {
    if (HaveNegativeB(simplex)) {
      html.innerHTML +=
          'В столбце b присутствуют отрицательные значения. Решения не существует.'
      return {
        answer:
            'В столбце b присутствуют отрицательные значения. Решения не существует.',
        solve: html,
      }
    }

    let answer = PrintAnswer(simplex)
    html.innerHTML += '<b>Ответ:</b> ' + answer
  }
}

function PrintAM(C, brackets = false) {
  if (C.a.isZero() && C.m.isZero()) return '0'
  if (brackets) {
    if (C.a.isZero()) {
      if (C.m.abs().isOne()) return C.m.isPos() ? 'M' : '- M'
      return (
        (C.m.isPos()
          ? C.m.print(printMode)
          : '- ' + C.m.abs().print(printMode)) + 'M'
      )
    }
  }
  if (C.a.isZero()) {
    if (C.m.abs().isOne()) return C.m.isPos() ? 'M' : '-M'
    return C.m.print(printMode) + 'M'
  }
  if (C.m.isZero()) return C.a.print(printMode)
  let html = C.a.print(printMode)
  if (brackets) html += '('
  if (C.m.isNeg()) html += ' - '
  else html += ' + '
  if (C.m.abs().isOne()) html += 'M'
  else html += C.m.abs().print(printMode) + 'M'
  if (brackets) html += ')'
  return html
}
function AddAM(v1, v2) {
  let a = v1.a.add(v2.a)
  let m = v1.m.add(v2.m)
  return { a: a, m: m }
}
function SubAM(v1, v2) {
  let a = v1.a.sub(v2.a)
  let m = v1.m.sub(v2.m)
  return { a: a, m: m }
}
function MultAM(v, x) {
  let a = v.a.mult(x)
  let m = v.m.mult(x)
  return { a: a, m: m }
}
function LessAM(v1, v2) {
  if (!v1.m.eq(v2.m)) return v1.m.lt(v2.m)
  return v1.a.lt(v2.a)
}
function GreaterAM(v1, v2) {
  if (!v1.m.eq(v2.m)) return v1.m.gt(v2.m)
  return v1.a.gt(v2.a)
}
function IsPosAM(v) {
  if (!v.m.isZero()) return v.m.isPos()
  return v.a.isPos()
}
function IsNegAM(v) {
  if (!v.m.isZero()) return v.m.isNeg()
  return v.a.isNeg()
}
function IsZeroAM(v) {
  return v.a.isZero() && v.m.isZero()
}
function ChangeSignsArtificialBasis(restricts) {
  let html =
    '<b>Меняем знаки у ограничений с отрицательными свободными коэффициентами, путём умножения на -1:</b><br>'
  let have = false
  for (let i = 0; i < restricts.length; i++) {
    if (restricts[i].b.isNeg()) {
      if (restricts[i].sign == GE) {
        restricts[i].sign = LE
      } else if (restricts[i].sign == LE) {
        restricts[i].sign = GE
      }
      for (let j = 0; j < restricts[i].values.length; j++)
        restricts[i].values[j].changeSign()
      restricts[i].b.changeSign()
      have = true
    }
    html += PrintFunction(restricts[i].values)
    html += ' ' + restricts[i].sign + ' '
    html += restricts[i].b.print(printMode)
    html += '<br>'
  }
  html += '<br>'
  return have ? html : ''
}
function PrintTableArtificialBasis(simplex, row = -1, col = -1) {
  let html = '<br>'
  let n = simplex.n
  html += "<table class='simplex-table'>"
  html += '<tr><td><b>C</b></td>'
  for (let i = 0; i < simplex.C.length; i++) {
    html += '<td>' + PrintAM(simplex.C[i]) + '</td>'
  }
  html += '</tr>'
  html += '<tr><th>базис</th>'
  for (let i = 0; i < simplex.total; i++) {
    if (i < simplex.total - simplex.avars.length) {
      html += '<th>x<sub>' + (i + 1) + '</sub></th>'
    } else {
      html +=
        '<th>u<sub>' +
        (i + 1 - simplex.total + simplex.avars.length) +
        '</sub></th>'
    }
  }
  html += '<th>b</th>'
  if (simplex.Q.length > 0) html += '<th>Q</th>'
  html += '</tr>'
  for (let i = 0; i < simplex.m; i++) {
    if (simplex.basis[i] < 0)
      html += '<tr><td><b>?<sub>' + -simplex.basis[i] + '</sub></b></td>'
    else if (simplex.basis[i] >= simplex.total - simplex.avars.length)
      html +=
        '<tr><td><b>u<sub>' +
        (1 + simplex.basis[i] - simplex.total + simplex.avars.length) +
        '</sub></b></td>'
    else
      html += '<tr><td><b>x<sub>' + (1 + simplex.basis[i]) + '</sub></b></td>'
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
  if (simplex.deltas.length > 0) {
    html += '<tr><td><b>&Delta;</b></td>'
    for (let i = 0; i < simplex.deltas.length; i++)
      html += '<td>' + PrintAM(simplex.deltas[i]) + '</td>'
    html += '</tr>'
  }
  html += '</table>'
  html += '<br>'
  return html
}
function CalculateDeltasArtificialBasis(simplex) {
  for (let j = 0; j < simplex.total; j++) {
    let delta = { a: new Fraction('0'), m: new Fraction('0') }
    for (let i = 0; i < simplex.m; i++)
      delta = AddAM(
        delta,
        MultAM(simplex.C[simplex.basis[i]], simplex.table[i][j])
      )
    simplex.deltas[j] = SubAM(delta, simplex.C[j])
  }
  let delta = { a: new Fraction('0'), m: new Fraction('0') }
  for (let i = 0; i < simplex.m; i++)
    delta = AddAM(delta, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]))
  simplex.deltas[simplex.total] = SubAM(delta, simplex.C[simplex.total])
}
function CalculateDeltasArtificialBasisSolve(simplex) {
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
        PrintAM(simplex.C[simplex.basis[i]]) +
        '·' +
        simplex.table[i][j].printNg(printMode)
      if (i < simplex.m - 1) {
        delta += ' + '
        formula += ' + '
      }
    }
    formula += ' - C<sub>' + (j + 1) + '</sub>'
    delta += ' - ' + PrintAM(simplex.C[j])
    delta += ' = ' + PrintAM(simplex.deltas[j])
    hint += formula + ' = ' + delta + '<br>'
  }
  let formula = '&Delta;<sub>b</sub> = '
  let delta = ''
  for (let i = 0; i < simplex.m; i++) {
    formula +=
      'C<sub>' + (simplex.basis[i] + 1) + '</sub>·b<sub>' + (i + 1) + '</sub>'
    delta +=
      PrintAM(simplex.C[simplex.basis[i]]) +
      '·' +
      simplex.b[i].printNg(printMode)
    if (i < simplex.m - 1) {
      delta += ' + '
      formula += ' + '
    }
  }
  formula += ' - C<sub>' + (simplex.total + 1) + '</sub>'
  delta += ' - ' + PrintAM(simplex.C[simplex.total])
  delta += ' = ' + PrintAM(simplex.deltas[simplex.total])
  hint += formula + ' = ' + delta
  hint = CreateScrollBlock(hint)
  html += CreateHideOpenBlock('Подробный расчёт дельт', hint)
  return html
}
function PrepareArtificialBasis(n, m, func, restricts, mode) {
  let k = 0
  for (let i = 0; i < restricts.length; i++) if (restricts[i].sign != EQ) k++
  let html = ''
  if (k > 2) {
    html +=
      'Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub>..x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 2) {
    html +=
      'Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>' +
      (n + 1) +
      '</sub> и x<sub>' +
      (n + k) +
      '</sub>.<br>'
  } else if (k == 1) {
    html +=
      'Для ограничения с неравенством <b>добавляем дополнительную переменную</b> x<sub>' +
      (n + 1) +
      '</sub>.<br>'
  }
  let simplex = {
    n: n,
    m: m,
    total: n + k,
    mode: mode,
    table: [],
    b: [],
    basis: [],
    avars: [],
    C: [],
    deltas: [],
    Q: [],
  }
  let unknown = -1
  let index = 0
  let basisHtml = []
  for (let i = 0; i < m; i++) {
    simplex.table[i] = []
    for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j])
    let inserted = false
    if (restricts[i].sign == EQ) {
      simplex.basis.push(unknown)
      unknown--
      basisHtml[simplex.basis.length - 1] =
        'Ограничение ' +
        (i + 1) +
        ' содержит равенство. Базисная переменная для этого ограничения будет определена позднее.<br>'
    } else if (restricts[i].sign == GE) {
      simplex.basis.push(unknown)
      unknown--
      basisHtml[simplex.basis.length - 1] =
        'Ограничение ' +
        (i + 1) +
        ' содержит неравенство с ' +
        GE +
        '. Базисная переменная для этого ограничения будет определена позднее.<br>'
    }
    for (let j = 0; j < k; j++) {
      if (restricts[i].sign == EQ) {
        simplex.table[i].push(new Fraction('0'))
      } else if (restricts[i].sign == LE) {
        if (j != index || inserted) {
          simplex.table[i].push(new Fraction('0'))
        } else if (!inserted) {
          simplex.table[i].push(new Fraction('1'))
          simplex.basis.push(n + index)
          basisHtml[simplex.basis.length - 1] =
            'Ограничение ' +
            (i + 1) +
            ' содержит неравенство, базисной будет добавленная дополнительная переменная x<sub>' +
            (n + index + 1) +
            '</sub><br>'
          index++
          inserted = true
        }
      } else {
        if (j != index || inserted) {
          simplex.table[i].push(new Fraction('0'))
        } else if (!inserted) {
          simplex.table[i].push(new Fraction('-1'))
          index++
          inserted = true
        }
      }
    }
    simplex.b[i] = restricts[i].b
  }
  unknown = 0
  for (let i = 0; i < m; i++) {
    if (simplex.basis[i] >= 0) continue
    let column = GetIdentityColumn(simplex, i)
    if (column != -1) {
      simplex.basis[i] = column
      basisHtml[i] =
        'Столбец ' +
        (column + 1) +
        ' является частью единичной матрицы. Переменная x<sub>' +
        (column + 1) +
        '</sub> входит в начальный базис<br>'
    } else {
      unknown++
    }
  }
  for (let i = 0; i < n; i++) {
    simplex.C.push({ a: func[i], m: new Fraction('0') })
  }
  for (let i = 0; i < k; i++) {
    simplex.C.push({ a: new Fraction('0'), m: new Fraction('0') })
  }
  simplex.C.push({ a: new Fraction('0'), m: new Fraction('0') })
  html += basisHtml.join('')
  html += '<br><b>Начальная симплекс-таблица</b>'
  html += PrintTableArtificialBasis(simplex)
  simplex.total += unknown
  if (unknown == 0) {
    html +=
      'Так как были найдены все базисные переменные, то нет необходимости добавления искусственных переменных.<br><br>'
  } else {
    for (let i = 0; i < unknown; i++) {
      simplex.avars.push(i)
      for (let j = 0; j < m; j++) simplex.table[j].push(new Fraction('0'))
    }
    index = 0
    for (let i = 0; i < m; i++) {
      if (simplex.basis[i] >= 0) continue
      html +=
        'Для ограничения ' +
        (i + 1) +
        ' добавляем искусственную переменную u<sub>' +
        (index + 1) +
        '</sub> и делаем её базисной.<br>'
      simplex.table[i][n + k + index] = new Fraction('1')
      simplex.basis[i] = n + k + index
      index++
    }
    simplex.C.pop()
    for (let i = 0; i < unknown; i++) {
      simplex.C.push({
        a: new Fraction('0'),
        m: new Fraction(mode == MIN ? '1' : '-1'),
      })
    }
    simplex.C.push({ a: new Fraction('0'), m: new Fraction('0') })
    html +=
      'В целевую функцию добавляем искусственные пременные с коэффициентом ' +
      (mode == MAX ? '-M' : 'M') +
      ', где M — очень большое число.<br>'
    html += '<br><b>Таблица с искусственными переменными</b>'
    html += PrintTableArtificialBasis(simplex)
    html +=
      '<b>Перепишем условие задачи с учётом добавленных искусственных переменных:</b><br>'
    html += 'F = '
    let printed = false
    for (let i = 0; i < simplex.total; i++) {
      if (IsZeroAM(simplex.C[i])) continue
      if (printed) {
        if (simplex.C[i].a.isZero())
          html += simplex.C[i].m.isPos() ? ' + ' : ' '
        else if (simplex.C[i].m.isZero())
          html += simplex.C[i].a.isPos() ? ' + ' : ' '
        else html += ' + '
      }
      html += PrintAM(simplex.C[i], true)
      printed = true
      if (i < simplex.total - simplex.avars.length) {
        html += 'x<sub>' + (i + 1) + '</sub>'
      } else {
        html +=
          'u<sub>' + (i + 1 - simplex.total + simplex.avars.length) + '</sub>'
      }
    }
    html += ' &rarr; ' + mode + '<br>'
    for (let i = 0; i < m; i++) {
      printed = false
      for (let j = 0; j < simplex.total; j++) {
        if (simplex.table[i][j].isZero()) continue
        if (printed && simplex.table[i][j].isPos()) html += '+ '
        if (simplex.table[i][j].isNeg()) {
          if (simplex.table[i][j].abs().isOne()) html += '- '
          else html += '- ' + simplex.table[i][j].abs().print(printMode) + '·'
        } else {
          if (!simplex.table[i][j].isOne())
            html += simplex.table[i][j].print(printMode) + '·'
        }
        printed = true
        if (j < simplex.total - simplex.avars.length) {
          html += 'x<sub>' + (j + 1) + '</sub> '
        } else {
          html +=
            'u<sub>' +
            (j + 1 - simplex.total + simplex.avars.length) +
            '</sub> '
        }
      }
      html += '= ' + simplex.b[i].print(printMode) + '<br>'
    }
    html +=
      '<br><b>Выразим искусственные переменные через базовые' +
      (k > 0 ? ' и дополнительные' : '') +
      ':</b><br>'
    for (let i = 0; i < m; i++) {
      if (simplex.basis[i] < simplex.total - simplex.avars.length) continue
      html +=
        'u<sub>' +
        (1 + simplex.basis[i] - simplex.total + simplex.avars.length) +
        '</sub> = ' +
        simplex.b[i].print(printMode)
      for (let j = 0; j < n + k; j++) {
        if (simplex.table[i][j].isZero()) continue
        if (simplex.table[i][j].isNeg()) {
          html += ' + '
        } else {
          html += ' - '
        }
        if (!simplex.table[i][j].abs().isOne())
          html += simplex.table[i][j].abs().print(printMode) + '·'
        html += 'x<sub>' + (j + 1) + '</sub>'
      }
      html += '<br>'
    }
    html += '<br>'
  }
  return { simplex: simplex, html: html }
}
function CheckPlanArtificialBasis(simplex) {
  for (let i = 0; i < simplex.total; i++) {
    if (simplex.mode == MAX && IsNegAM(simplex.deltas[i])) return false
    if (simplex.mode == MIN && IsPosAM(simplex.deltas[i])) return false
  }
  return true
}
function CheckPlanArtificialBasisSolve(simplex) {
  let hint = CreateHideOpenBlock(
    'Критерий оптимальности',
    'План оптимален, если в таблице отсутствуют ' +
      (simplex.mode == MAX ? 'отрицательные' : 'положительные') +
      ' дельты. '
  )
  let html = '<b>Проверяем план на оптимальность:</b> '
  for (let i = 0; i < simplex.total; i++) {
    if (simplex.mode == MAX && IsNegAM(simplex.deltas[i])) {
      html +=
        'план <b>не оптимален</b>, так как &Delta;<sub>' +
        (i + 1) +
        '</sub> = ' +
        PrintAM(simplex.deltas[i]) +
        ' отрицательна.<br>'
      html += hint
      return html
    }
    if (simplex.mode == MIN && IsPosAM(simplex.deltas[i])) {
      html +=
        'план <b>не оптимален</b>, так как &Delta;<sub>' +
        (i + 1) +
        '</sub> = ' +
        PrintAM(simplex.deltas[i]) +
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
function GetQandRowArtificialBasis(simplex, j) {
  let imin = -1
  let imina = -1
  for (let i = 0; i < simplex.m; i++) {
    simplex.Q[i] = null
    if (simplex.table[i][j].isZero()) continue
    let q = simplex.b[i].div(simplex.table[i][j])
    if (q.isNeg() || (simplex.b[i].isZero() && simplex.table[i][j].isNeg()))
      continue
    simplex.Q[i] = q
    if (simplex.basis[i] >= simplex.total - simplex.avars.length) {
      if (imina == -1 || q.lt(simplex.Q[imina])) imina = i
    }
    if (imin == -1 || q.lt(simplex.Q[imin])) imin = i
  }
  return imina == -1 ? imin : imina
}
function GetColumnArtificialBasis(simplex) {
  let jmax = 0
  for (let j = 1; j < simplex.total; j++) {
    if (simplex.mode == MAX && LessAM(simplex.deltas[j], simplex.deltas[jmax]))
      jmax = j
    else if (
      simplex.mode == MIN &&
      GreaterAM(simplex.deltas[j], simplex.deltas[jmax])
    )
      jmax = j
  }
  return jmax
}
function MakeVarBasisArtificial(simplex, row, column, print = false) {
  let html = ''
  if (simplex.basis[row] >= simplex.total - simplex.avars.length)
    html +=
      'В качестве базисной переменной u<sub>' +
      (1 + simplex.basis[row] - simplex.total + simplex.avars.length) +
      '</sub> берём x<sub>' +
      (column + 1) +
      '</sub>.<br>'
  else
    html +=
      'В качестве базисной переменной x<sub>' +
      (simplex.basis[row] + 1) +
      '</sub> берём x<sub>' +
      (column + 1) +
      '</sub>.<br>'
  simplex.basis[row] = column
  if (print) html += PrintTableArtificialBasis(simplex, row, column)
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
function CalcFunctionArtificialBasis(simplex) {
  let F = { a: new Fraction('0'), m: new Fraction('0') }
  let X = []
  let html = ''
  for (let i = 0; i < simplex.m; i++)
    F = AddAM(F, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]))
  for (let i = 0; i < simplex.total; i++) {
    html += PrintAM(simplex.C[i]) + '·'
    let index = simplex.basis.indexOf(i)
    if (index == -1) {
      html += '0 '
      X.push('0')
    } else {
      html += simplex.b[index].printNg(printMode) + ' '
      X.push(simplex.b[index].print(printMode))
    }
    if (i < simplex.total - 1) html += '+ '
  }
  return { result: F, plan: '[ ' + X.join(', ') + ' ]', solve: html }
}
function PrintAnswerArtificialBasis(simplex) {
  let answer = ''
  for (let i = 0; i < simplex.n; i++) {
    let index = simplex.basis.indexOf(i)
    answer += 'x<sub>' + (i + 1) + '</sub> = '
    if (index == -1) answer += '0, '
    else answer += simplex.b[index].print(printMode) + ', '
  }
  let F = { a: new Fraction('0'), m: new Fraction('0') }
  for (let i = 0; i < simplex.m; i++)
    F = AddAM(F, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]))
  answer += 'F = ' + PrintAM(F)
  return answer
}
function HaveArtificialBasis(simplex, zero = true) {
  for (let i = 0; i < simplex.basis.length; i++)
    if (
      simplex.basis[i] >= simplex.total - simplex.avars.length &&
      (!zero || !simplex.b[i].isZero())
    )
      return true
  return false
}
function SolveArtificialBasis(n, m, func, restricts, mode, html) {
  html += ChangeSignsArtificialBasis(restricts)
  let init = PrepareArtificialBasis(n, m, func, restricts, mode)
  let simplex = init.simplex
  html += init.html
  CalculateDeltasArtificialBasis(simplex)
  html += '<b>Вычисляем дельты:</b> '
  html += CalculateDeltasArtificialBasisSolve(simplex)
  html += '<b>Симплекс-таблица с дельтами</b>'
  html += PrintTableArtificialBasis(simplex)
  let iteration = 1
  let F = CalcFunctionArtificialBasis(simplex)
  html += '<b>Текущий план X:</b> ' + F.plan + '<br>'
  html +=
    '<b>Целевая функция F:</b> ' + F.solve + ' = ' + PrintAM(F.result) + '<br>'
  html += CheckPlanArtificialBasisSolve(simplex)
  while (!CheckPlanArtificialBasis(simplex)) {
    html += '<h3>Итерация ' + iteration + '</h3>'
    let column = GetColumnArtificialBasis(simplex)
    html +=
      'Определяем <i>разрешающий столбец</i> - столбец, в котором находится '
    html += (simplex.mode == MAX ? 'минимальная' : 'максимальная') + ' дельта: '
    html +=
      column +
      1 +
      ', &Delta;<sub>' +
      (column + 1) +
      '</sub>: ' +
      PrintAM(simplex.deltas[column]) +
      '<br>'
    html +=
      'Находим симплекс-отношения Q, путём деления коэффициентов b на соответствующие значения столбца ' +
      (column + 1) +
      '<br>'
    let row = GetQandRowArtificialBasis(simplex, column)
    if (row == -1) {
      html += PrintTableArtificialBasis(simplex, -1, column)
      html += 'Все значения столбца ' + (column + 1) + ' неположительны.<br>'
      html +=
        '<b>Функция не ограничена. Оптимальное решение отсутствует</b>.<br>'
      return {
        answer: 'Функция не ограничена. Оптимальное решение отсутствует.',
        solve: html,
      }
    }
    html +=
      'В найденном столбце ищем строку с наименьшим значением Q: Q<sub>min</sub> = ' +
      simplex.Q[row].print(printMode) +
      ', строка ' +
      (row + 1) +
      '.<br>'
    html +=
      'На пересечении найденных строки и столбца находится <i>разрешающий элемент</i>: ' +
      simplex.table[row][column].print(printMode) +
      '<br>'
    html += MakeVarBasisArtificial(simplex, row, column, true)
    CalculateDeltasArtificialBasis(simplex)
    html += '<b>Вычисляем новые дельты:</b> '
    html += CalculateDeltasArtificialBasisSolve(simplex)
    html += '<b>Симплекс-таблица с обновлёнными дельтами</b>'
    html += PrintTableArtificialBasis(simplex)
    let F = CalcFunctionArtificialBasis(simplex)
    html += '<b>Текущий план X:</b> ' + F.plan + '<br>'
    html +=
      '<b>Целевая функция F:</b> ' +
      F.solve +
      ' = ' +
      PrintAM(F.result) +
      '<br>'
    iteration++
    html += CheckPlanArtificialBasisSolve(simplex)
  }
  if (HaveArtificialBasis(simplex)) {
    html +=
      'Так как в оптимальном решении пристуствуют искусственные переменные, то задача не имеет допустимого решения.'
    return { answer: 'Задача не имеет допустимого решения.', solve: html }
  }
  if (HaveNegativeB(simplex)) {
    html +=
      'В столбце b присутствуют отрицательные значения. Решения не существует.'
    return { answer: 'Решения не существует.', solve: html }
  }
  if (HaveArtificialBasis(simplex, false)) {
    html +=
      'Искусственные переменные остались базисными, однако свободный коэффициент при них равен нулю.<br>'
  }
  html += '<b>Ответ:</b> '
  let answer = PrintAnswerArtificialBasis(simplex)
  return { answer: answer, solve: html + answer + '<br>' }
}
function Solve() {
  try {
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
    let result
    if (InputStoreService.getSolution()) {
      if (InputStoreService.getSolveType() == 1) {
        result = SolveTable(n, m, func, restricts, mode, solveBox)
        // solveBox.innerHTML +=
        //   '<h3>Ответ</h3>' + CreateScrollBlock(resultAnswer)
        // solveBox.innerHTML +=
        //   '<h3>Решение базовым симплекс-методом</h3> ' + result.solve
      } else {
        result = SolveArtificialBasis(n, m, func, restricts, mode, solveBox)
        solveBox.innerHTML +=
          '<h3>Ответ</h3>' + CreateScrollBlock(result.answer)
        solveBox.innerHTML +=
          '<h3>Решение методом искусственного базиса</h3> ' + result.solve
      }
    } else {
      const div = document.createElement('div')
      result = SolveTable(n, m, func, restricts, mode, div)
      solveBox.innerHTML += '<h3>Ответ</h3>' + CreateScrollBlock(resultAnswer)
    }
    // updateScrollblocks()
    // scrollTo('#simplex-solve')
    // console.log(InputToString(func, mode, restricts))
    // console.log(
    //   result.answer.replace(/\<sub\>/gi, '').replace(/\<\/sub\>/gi, '')
    // )
  } catch (e) {
    alert('Ошибка: ' + e)
  }
  // updateHideOpenBlock()
}

export const init = () => {
  window.Solve = Solve
  window.step = step
}
// console.log('1.js')
window.Solve = Solve
