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
 * Uses 0, 0 to represent top left corner
 * 
 * @param {*} key 
 * @param {*} code 
 * @returns 
 */
function getLocation(key, code){
    let using = key
    if(key == 'Shift'){
        using = code
    }

    if(!findInMatrix(keyboard, using)){
        return null
    }

    let {r, c} = findInMatrix(keyboard, using)
    let {x, y} = {x : (rowSum(spacing[r], c) + spacing[r][c] * 0.5) / 15, y: (r + 0.5) / 4}

    return {x, y}
}