let autocomplete = document.getElementById("autocomplete")
let equation_picker = document.getElementById("equation-picker")

let wasFocused = undefined
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.code === "Space") {
      // Perform your desired action here
      autocomplete.classList.remove("hidden")
      equation_picker = document.getElementById("equation-picker")
      wasFocused = document.activeElement
      equation_picker.focus()
    }
    if(event.code == "Escape"){
        autocomplete.classList.add("hidden")
        if(wasFocused) wasFocused.focus()
    }
  });

accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#equation-picker'),
    // additional options
    onConfirm: (value) => {
        autocompleteChanged(value)
    },
    hintClasses: null
})

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
    focus: "name"
}

let expr = {
    name: "expression",
    fields: ["inside"],
    data: {},
    direction: "row",
    symbol: (x) => "",
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
    symbol: (x) => x != 0 ? "<hr>" : "",
    render: (data) => `\\frac{${data["numerator"]}}{${data["denominator"]}}`,
    focus: "numerator"
}

let equals = {
    name: "equals",
    fields: ["left", "right"],
    data: {},
    direction: "row",
    symbol: (x) => x == 1 ? "=" : "",
    render: (data) => `${data["left"]}=${data["right"]}`,
    focus: "left"
}

let plus = {
    name: "plus",
    fields: ["left", "right"],
    data: {},
    direction: "row",
    symbol: (x) => x == 1 ? "+" : "",
    render: (data) => `${data["left"]}=${data["right"]}`,
    focus: "left"
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
    "add": plus
}

let getById = {}

function create_new(type, parent, slot){
    let ret = JSON.parse(JSON.stringify(type))
    ret.id = parent.id + "." + slot

    if(slot == "..."){
        parent.data[slot].push(ret)
        ret.id += "." + (parent.data[slot].length - 1)
    }else{
        parent.data[slot] = ret
    }

    ret.render = type.render
    ret.symbol = type.symbol
    ret.parent = parent

    getById[ret.id] = ret

    return ret
}

let expression = (JSON.parse(JSON.stringify(expr)) ); expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.parent = undefined
getById["top"] = expression

function renderDiv(obj, myId="", idx=0){
    if (typeof obj === "string") {
        return `<input tabindex="0" type="text" class="placeholder" id="${myId}" idx=${idx} myId="${myId}" onfocus="amSelecting(this)" value="${obj}"/>`
    }

    let str = 
        `<div onfocus="amSelecting(this)" aria-describedby="${obj.id}.readaloud" aria-labelledby="${obj.id}.readaloud" tabindex="0" class="block" style="flex-direction:${obj.direction}">
            
            ${(() => {
                var total = ""
                total += `<span style="width: 100%; height: 100%;">${obj.symbol(0)}</span>`
                for(var i = 0; i < obj.fields.length; i++){
                    if(i > 0){
                        total += `<span style="width: 100%; height: 100%;">${obj.symbol(i)}</span>`
                    }
                    let field = obj.fields[i]
                    if(field == "..."){
                        console.log('render here')
                        for(var j = 0; j < obj.data["..."].length; j++){
                            if(j > 0){
                                total += `<span>${obj.symbol(j)}</span>`
                            }
                            console.log('subrender: ' + obj.data["..."][j] + " " + obj.id + " " + j)
                            total += renderDiv(obj.data["..."][j], obj.id, j)
                        }
                        total += `<button tabindex="0" id="${obj.id}.button" myId="${obj.id}" onclick="addToList('${obj.id}')">+</button>`
                    }else{
                        if(obj.data[field]){
                            total += renderDiv(obj.data[field])
                        }else{
                            total += `<input aria-label="${field} of ${obj.name}" tabindex="0" type="text" class="placeholder" id="${obj.id}.${field}" myId="${obj.id}" field="${field}" onfocus="amSelecting(this)" onchange="handleValueChanged(this)" oninput="this.style.width = (this.value.length) + 'ch';"/>`
                        }
                    }
                }
                if(obj.name!="list")
                    total += `<span>${obj.symbol(obj.fields.length)}</span>`
                return total
            })()}
        </div>`

    return str
}

let selected = undefined

function amSelecting(input){
    // TODO: change aria label
    // if selected exists, update aria label
    if(selected){
        updateAriaLabel(selected)
    }

    //input.style.background = "black"
    console.log('selected: ')
    console.log(input)

    console.log('labeled by: ' + input.getAttribute("aria-labelledby"))
    console.log(document.getElementById(input.getAttribute("aria-labelledby")))
    selected = input
}

function updateAriaLabel(selected){
    let div = document.getElementById("hiddenreadalouds")

    let id = selected.getAttribute("myID")

    if(selected.nodeName == 'INPUT'){
        console.log("was input")
        let readaloudID = id + ".readaloud"
        let readaloudElem = document.getElementById(readaloudID)

        let latex = renderLaTeX(getById[id])

        let elem = document.createElement("div");
        let label = genAriaLabel(latex, readaloudID)
        //console.log('label: ', label)
        elem.id = readaloudID
        if(typeof label == 'string')
            elem.innerHTML = label
        else
            elem.innerHTML = label.outerHTML
        if(!readaloudElem){
            div.appendChild(elem)
        }else{
            readaloudElem.innerHTML = elem.outerHTML

            console.log("new HTML: " + readaloudElem.innerHTML)
        }
    }

    if(selected.parent)
        updateAriaLabel(selected.parent)
}

function genAriaLabel(latex, id){
    let mathml = MathJax.tex2chtml(latex, {em: 12, ex: 6, display: true});
    mathml.id = id

    return SRE.toSpeech(mathml.outerHTML)
}

function handleValueChanged(input){
    let fieldName = input.getAttribute("field")
    let id = input.getAttribute("myID")
    //console.log('hi ' + fieldName)
    getById[id].data[fieldName] = input.value
    //console.log(getById[id])
}

function addToList(id){
    create_new(expr, getById[id], "...")

    rerender()

    waitForElm(id + "." + '...' + '.' + (getById[id].data['...'].length - 1) + ".inside").then((elm) => {
        console.log('finished waiting')
        elm.focus()
    })
}

function rerender(){
    let blocks = document.getElementById("blocks")
    blocks.innerHTML = renderDiv(expression)
}

function autocompleteChanged(value) {
    if(!selected){
        alert("No field selected! Don't know where to put this")
        return;
    }

    if(value == ""){
        return;
    }

    autocomplete.classList.add("hidden")
    if(wasFocused) wasFocused.focus()

    document.getElementById("emptySelection").selected = true
    setTimeout(() => {
        console.log('reset value')
        equation_picker.value = ""
    }, 500)

    const selectedValue = value;
    // Perform actions based on the selected value
    console.log("Picked:", selectedValue);

    let field = selected.getAttribute("field")
    let id = selected.getAttribute("myId")

    let newItem = create_new(lookup[value], getById[id], field)

    getById[id].data[field] = newItem

    waitForElm(newItem.id + "." + newItem.focus).then((elm) => {
        console.log('finished waiting')
        elm.focus()
    })

    rerender()
    //document.getElementById().focus()
}

waitForElm(expression.id + "." + expression.focus).then((elm) => {
    console.log('finished waiting')
    elm.focus()
})

rerender()


function renderLaTeX(element){
    if(!element){
        return ""
    }

    if(typeof element === 'string'){
        return element
    }

    if(Array.isArray(element)){
        let vals = []
        for(var x of element){
            vals.push(renderLaTeX(x))
        }

        return vals
    }

    let vals = {}
    for(var x of element.fields){
        vals[x] = renderLaTeX(element.data[x])
    }

    return element.render(vals)
}