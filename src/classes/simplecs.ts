import InputStoreService from "./services/InputStoreService";

export class Simplecs {
    private iteration: number = 0
    private horisont_x: number[] = []
    private vertical_x: number[] = []
    private free: number[] = []
    private matrix: number[][] = [[]]
    private func: number[]= []

    constructor(matrix: number[][], func: number[]) {
        this.matrix = matrix
        this.func = func
    }

    public calculate = () => {
        const max_x = InputStoreService.getMaxX()
        let result
        //	var count_ogr = $('#ogranichenie_block .ogranichenie').length;
        let i = 0
        /*################## ШАГ 0 ##################*/
        // Перебираем все ограничения
        // Массив индексов по горизонтале
        for (i = 0; i < max_x + 1; i++) {
            this.horisont_x[i] = i
        }
        // Массив индексов по вертикале
        for (i = 0; i < InputStoreService.getRowCount(); i++) {
            this.vertical_x[i] = i + max_x
        }
        // Матрица свободных членов
        for (var k = 0; k < this.matrix.length; k++) {
            this.free[k] = this.matrix[k][max_x]
        }
        this.free[this.matrix.length] = 0

        // Последняя строка сама функция
        this.matrix.push(this.func)

        // Есть ли  отрицательные элементы в матрице свободных членов ?
        if (this.minelm(this.free) < 0) {
            this.iteration = 0 // счетчик итераций, для защиты от зависаний
            this.step1() // Переходим к шагу 1
        }
        // Есть ли  отрицательные элементы в коэфициентах функции (последняя строчка) ?
        if (this.minelm(this.matrix[this.matrix.length - 1], false, true) < 0) {
            this.iteration = 0 // счетчик итераций, для защиты от зависаний
            this.step2() // Переходим к шагу 2
        }
        this.print_table(this.matrix) // Отображаем итоговую таблицу
        this.results() // Отображаем результаты в понятном виде

        return false
    }

    /*################## ШАГ1 ##################*/
    private step1() {
        this.iteration++
        // находим ведущую строку
        var min_k_num = this.minelm(this.free, true, true)

        // находим ведущий столбец
        var min_k1 = this.minelm(this.free)
        if (this.minelm(this.matrix[min_k_num]) < 0) {
            var min_k1_num = this.minelm(this.matrix[min_k_num], true, true)
        } else {
            alert('Условия задачи несовместны и решений у нее нет')
            return false
        }
        // Печатаем таблицу и выделяем на ней ведущие строку и столбец
        this.print_table(this.matrix, min_k_num, min_k1_num)
        // Обновляем индексы элементов по горизонтале и вертикале
        let tmp = this.horisont_x[min_k1_num]
        this.horisont_x[min_k1_num] = this.vertical_x[min_k_num]
        this.vertical_x[min_k_num] = tmp

        // Замена
        this.update_matrix(min_k_num, min_k1_num)
        // матрица свободных членов
        for (var k = 0; k < this.matrix.length; k++) {
            this.free[k] = this.matrix[k][InputStoreService.getMaxX()]
        }

        if (this.minelm(this.free, false, true) < 0 && this.iteration < 10)
            if (confirm('продолжаем Шаг 1_' + this.iteration + ' ?'))
            // нужно ли еще разок пройти второй шаг ?
            // Да здравсвует рекурсия, но спросим (чтобы комп не завис)
                this.step1()
    }

    /*################## ШАГ2 ##################*/
    private step2() {
        this.iteration++
        // находим ведущий столбец
        var min_col_num = this.minelm(this.matrix[this.matrix.length - 1], true, true)

        // находим ведущую строку
        var cols_count = this.matrix[0].length - 1
        var min_row_num = 999
        // эмпирический коэфициент, тк мы не знаем, положително ли нулевое отношение
        var min_row = 9999
        var tmp = 0
        for (let i = 0; i < this.matrix.length - 1; i++) {
            tmp = this.free[i] / this.matrix[i][min_col_num]
            if (tmp < min_row && tmp >= 0) {
                min_row_num = i
                min_row = tmp
            }
        }

        let min_k1_num = min_col_num
        let min_k_num = min_row_num
        // Печатаем таблицу и выделяем на ней ведущие строку и столбец
        this.print_table(this.matrix, min_k_num, min_k1_num)
        // Обновляем индексы элементов по горизонтале и вертикале
        tmp = this.horisont_x[min_k1_num]
        this.horisont_x[min_k1_num] = this.vertical_x[min_k_num]
        this.vertical_x[min_k_num] = tmp
        // Если мы не нашли ведущую строку (999 - это наш эмпирический коэфициент)
        if (min_row_num == 999) {
            alert('функция в области допустимых решений задачи не ограничена')
            return false
        }

        // Замена
        this.update_matrix(min_k_num, min_k1_num)
        // матрица свободных членов
        for (var k = 0; k < this.matrix.length; k++) {
            this.free[k] = this.matrix[k][InputStoreService.getMaxX()]
        }

        // нужно ли еще разок пройти второй шаг ?
        if (this.minelm(this.matrix[this.matrix.length - 1], false, true) < 0 && this.iteration < 10)
            if (confirm('продолжаем Шаг 2_' + this.iteration + ' ?'))
            // Да здравсвует рекурсия, но спросим, чтобы комп не завис
                this.step2()
    }

    // Выводим результаты в понятном виде
    private results() {
        let nulls = ''
        // Иксы, равные нулю
        for (let i = 0; i < this.horisont_x.length - 1; i++) {
            if (this.horisont_x[i] < InputStoreService.getMaxX()) nulls += 'X' + (this.horisont_x[i] + 1) + '='
        }
        nulls += '0 <br /><br />'
        let vars = ''
        // Иксы, отличные от нуля
        for (let i = 0; i < this.vertical_x.length; i++) {
            if (this.vertical_x[i] < InputStoreService.getMaxX())
                vars += 'X' + (this.vertical_x[i] + 1) + '=' + this.matrix[i][InputStoreService.getMaxX()] + '<br />'
        }
        var main_result = ''
        // Минимум(максимум) функции
        // if ($('.uravnenie select').val() > 0)
            main_result = 'min F =' + this.matrix[this.matrix.length - 1][InputStoreService.getMaxX()] * -1
        // else main_result = 'max F =' + this.matrix[this.matrix.length - 1][InputStoreService.getMaxX()]
        // $('#result').append(nulls + vars + '<br />' + main_result)
    }

    // Функция замены (обновления матрицы)
    private update_matrix(min_k_num: number, min_k1_num: number) {
        let matrix1 = new Array()

        for (let i = 0; i < this.matrix.length; i++) {
            matrix1[i] = new Array()
            for (let j = 0; j < this.matrix[0].length; j++) {
                if (i == min_k_num && j == min_k1_num) {
                    matrix1[i][j] = 1 / this.matrix[i][j]
                } else {
                    if (i == min_k_num) {
                        matrix1[i][j] = (this.matrix[i][j] * 1) / this.matrix[min_k_num][min_k1_num]
                    } else {
                        if (j == min_k1_num) {
                            matrix1[i][j] =
                                (-this.matrix[i][j] * 1) / this.matrix[min_k_num][min_k1_num]
                        } else {
                            matrix1[i][j] =
                                this.matrix[i][j] -
                                (this.matrix[i][min_k1_num] * this.matrix[min_k_num][j]) /
                                this.matrix[min_k_num][min_k1_num]
                        }
                    }
                }
                matrix1[i][j] = Math.round(matrix1[i][j] * 1000) / 1000
            }
        }
        this.matrix = matrix1

        return false
    }

    private minelm = (v: number[], dispnum: boolean = false, not_last: boolean = false) =>  {
        var m = v[0]
        var num = 0
        var len = 0
        // если not_last, то последний элемент не учитываем в массиве
        if (not_last) {
            len = v.length - 2
        } else {
            len = v.length - 1
        }
        for (var i = 1; i <= len; i++) {
            if (v[i] < m) {
                m = v[i]
                num = i
            }
        }
        // Выводим номер минимального
        if (dispnum) {
            return num
        } else {
            // или значение
            return m
        }
    }

    private print_table(arr: number[][], row?: number, col?: number) {
        var max_i = arr.length
        var max_j = arr[0].length
        var html_table = ''
        var html_head = '<th></th>'
        // заголовки

        for (var j = 0; j < max_j - 1; j++) {
            html_head += '<th>X' + (this.horisont_x[j] + 1) + '</th>'
        }
        html_head += '<th>Своб.члены</th>'
        html_head = '<thead><tr>' + html_head + '</tr></thead>'
        // Элементы
        for (var i = 0; i < max_i; i++) {
            html_table += '<tr>'
            if (!(i == max_i - 1)) {
                html_table += '<th>X' + (this.vertical_x[i] + 1) + '</th>'
            } else {
                html_table += '<th>F</th>'
            }

            for (var j = 0; j < max_j; j++) {
                html_table += '<td>' + arr[i][j] + '</td>'
            }
            html_table += '</tr>'
        }

        return html_table

        // $('#result').append('<table>' + html_head + html_table + '</table>')
        // // Выделяем колонку, если указана
        // if (col !== undefined)
        //     $('table:last tr').each(function() {
        //         $(this)
        //             .children('td')
        //             .eq(col)
        //             .addClass('selected')
        //     })
        // // Выделяем строку, если указана
        // if (row !== undefined)
        //     $('table:last tr')
        //         .eq(row + 1)
        //         .addClass('selected')
    }
}
