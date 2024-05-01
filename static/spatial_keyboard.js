let keyboard = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
    ['ShiftLeft', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'ShiftRight']
]

let spacing = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
    [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
]

function rowSum(row, upToExclusive){
    let x = 0

    for(var r = 0; r < upToExclusive; r++){
        x += row[r]
    }

    return x
}

/**
 * 
 * Uses 0, 0 to represent top left corner, 1, 1 to represent bottom right
 * 
 * @param {*} key 
 * @param {*} code 
 * @returns 
 */
function getLocation(key, code){
    //console.log('key', key, key.length, 'code', code)
    if (key.length === 1) {
        key = key.toLowerCase()
    }
    //console.log('key', key, key.length, 'code', code)

    let using = key
    if(key == 'Shift'){
        using = code
    }

    //console.log(key, code)
    //console.log(findInMatrix(keyboard, using))

    if(!findInMatrix(keyboard, using)){
        console.log('null')
        return null
    }

    let {r, c} = findInMatrix(keyboard, using)
    let {x, y} = {x : (rowSum(spacing[r], c) + spacing[r][c] * 0.5) / 15, y: (r + 0.5) / 4}

    return {x, y}
}