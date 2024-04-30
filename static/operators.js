let func = {
    name: "function",
    fields: ["name", "input"],
    data: {},
    direction: "row",
    symbol: (x) => {
        if (x == 1) {
            return "("
        }
        if(x == 2) {
            return ")"
        }
        return ""
    },
    render: (x) => x["name"] + "(" + x["input"] + ")",
    focus: "name",
    focus2: "input"
}

let expr = {
    name: "expression",
    fields: ["inside"],
    data: {},
    direction: "row",
    symbol: (x) => "",
    readaloud: (x) => "",
    render: (x) => {
        return `${x["inside"]}`
    },
    focus: "inside"
}

let paren = {
    name: "parentheses",
    fields: ["inside"],
    data: {},
    direction: "row",
    symbol: (x) => {if (x == 0) return "("; else if (x == 1) return ")"; else return ""},
    render: (x) => {
        return `(${x["inside"]})`
    },
    focus: "inside"
}

//variable length list
let list = {
    name: "list",
    fields: ["..."],
    data: {"...": []},
    direction: "row",
    symbol: (x) => x > 0 ? "," : "",
    render: (y) => {
        let total_string = ""
        //console.log(y)
        for(var x of y["..."]){
            total_string += x
            total_string += ","
        }
        total_string = total_string.slice(0, -1);  // Output: removes last comma
        return total_string
    },
    focus: "button"
}

let frac = {
    name: "fraction",
    fields: ["numerator", "denominator"],
    data: {},
    direction: "column",
    symbol: (x) => x == 1 ? "<hr>" : "",
    readaloud: (x) => x == 1 ? "over" : "",
    render: (data) => `\\frac{${data["numerator"]}}{${data["denominator"]}}`,
    focus: "numerator",
    focus2: "denominator"
}

function genBinary(name, symbol){
    return {
        name: name,
        fields: ["left", "right"],
        data: {},
        direction: "row",
        symbol: (x) => x == 1 ? symbol : "",
        readaloud: (x) => x == 1 ? symbol : "",
        render: (data) => `${data["left"]}${symbol}${data["right"]}`,
        focus: "left",
        focus2: "right"
    }
}

function genAssociative(name, symbol, associatesWith){
    let type = genBinary(name, symbol)
    
}

let equals = genBinary('equals', '=')

let plus = genBinary('plus', '+')

let minus = genBinary('minus', '-')

let times = genBinary('times', '\\times')

let power = {
    name: "to the power of",
    fields: ["base", "exponent"],
    data: {},
    direction: "row",
    symbol: (x) => x == 1 ? "^" : "",
    render: (data) => `{${data["base"]}}^{${data["exponent"]}}`,
    focus: "base",
    focus2: "exponent"
}

let subscript = {
    name: "subscript",
    fields: ["base", "sub"],
    data: {},
    direction: "row",
    symbol: (x) => x == 1 ? "^" : "",
    render: (data) => `{${data["base"]}}_{${data["sub"]}}`,
    focus: "base",
    focus2: "sub"
}

let sum = {
    name: "sum",
    fields: ["from", "to", "expression"],
    data: {},
    direction: "row",
    symbol: (x) => x == 0 ? "Σ" : (x == 1 ? " to " : (x == 2 ? ": " : "")),
    readaloud: (x) => x == 0 ? "sum from" : (x == 1 ? " to " : (x == 2 ? " of " : "")),
    render: (data) => {
        let fromTo = ""
        if(data['from'] || data['to']){
            fromTo = `\\limits`
        }
        if(data['from']){
            fromTo += `_{${data['from']}}`
        }
        if(data['to']){
            fromTo += `^{${data['to']}}`
        }
        return `\\sum${fromTo}{${data['expression']}}`
    },
    focus: "from",
    focus2: "expression"
}

let integral = {
    name: "integral",
    fields: ["from", "to", "expression", "variable"],
    data: {},
    direction: "row",
    symbol: (x) => {
        if(x == 0)
            return "∫"
        if(x==1)
            return "→"
        if(x==2)
            return ":"
        if(x==3)
            return "d"
        return ""
    },
    render: (data) => {
        let fromTo = `_{${data['from']}}^{${data['to']}}`
        if(!data['from'] && !data['to'])
            fromTo = ''
        return `\\int${fromTo} ${data['expression']} \\, d${data['variable']}`
    },
    focus: "from",
    focus2: "expression"
}

function genFunction(name){
    return {
        name: name,
        fields: ["input"],
        data: {},
        direction: "row",
        symbol: (x) => {
            if (x == 0) {
                return name + "("
            }
            if(x == 1) {
                return ")"
            }
            return ""
        },
        render: (x) => name + "(" + x["input"] + ")",
        focus: "input"
    }
}

let lookup = {
    "expression": expr,
    "fraction": frac,
    "list": list,
    "parentheses": paren,
    "function" : func,
    "=": equals,
    "equals" : equals,
    "+": plus,
    "plus": plus,
    "add": plus,
    "-": minus,
    "minus": minus,
    "subtract": minus,
    "*": times,
    "multiply": times,
    "times": times,
    "^": power,
    "power": power,
    "exponent": power,
    "sum": sum,
    "sigma": sum,
    "integral": integral,
    "cos": genFunction("cos"),
    "ln": genFunction("ln"),
    "log": genFunction("log"),
    "_": subscript,
    "subscript": subscript
}