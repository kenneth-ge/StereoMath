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
    }
})

let func = {
    name: "function",
    fields: ["name", "input"],
    data: {},
    direction: "row",
    symbol: "",
    render: () => data["name"] + " (" + data["input"] + ")",
    focus: "name"
}

let paren = {
    name: "parentheses",
    fields: ["inside"],
    data: {},
    direction: "row",
    symbol: "",
    render: () => {
        return `(${data["inside"]})`
    },
    focus: "inside"
}

//variable length list
let list = {
    name: "list",
    fields: ["..."],
    data: {"...": []},
    direction: "row",
    symbol: ",",
    render: () => {
        for(var x of data["..."]){
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
    symbol: "<hr>",
    render: () => `\\frac{${data["numerator"]}}{data["numerator"]}`,
    focus: "numerator"
}

let lookup = {
    "fraction": frac,
    "list": list,
    "parentheses": paren,
    "function" : func
}

let getById = {}

function create_new(type, parent, slot){
    let ret = JSON.parse(JSON.stringify(type))
    ret.id = parent.id + "." + slot

    if(slot == "..."){
        parent.data[slot].append(ret)
    }else{
        parent.data[slot] = ret
    }

    getById[ret.id] = ret

    return ret
}

let expression = { ...paren }; expression.id = "top"
getById["top"] = expression

function renderDiv(obj){
    if (typeof obj === "string") {
        return `<input type="text" class="placeholder" myId="${obj.id}" onfocus="amSelecting(this)" value="${obj}"/>`
    }

    let str = 
        `<div class="block" style="flex-direction:${obj.direction}">
            ${(() => {
                var total = ""
                for(var i = 0; i < obj.fields.length; i++){
                    if(i > 0){
                        total += `<span>${obj.symbol}</span>`
                    }
                    let field = obj.fields[i]
                    if(field == "..."){
                        for(var j = 0; j < obj.data["..."].length; j++){
                            if(j > 0){
                                total += `<span>${obj.symbol}</span>`
                            }
                            total += renderDiv(obj.data["..."][j])
                        }
                        total += `<button id="${obj.id}.button" myId="${obj.id}" onclick="addToList('${obj.id}')">+</button>`
                    }else{
                        if(obj.data[field]){
                            total += renderDiv(obj.data[field])
                        }else{
                            total += `<input type="text" class="placeholder" id="${obj.id}.${field}" myId="${obj.id}" field="${field}" onfocus="amSelecting(this)" onchange="handleValueChanged(this)"/>`
                        }
                    }
                }
                return total
            })()}
        </div>`

    return str
}

let selected = undefined

function amSelecting(input){
    //input.style.background = "black"
    console.log('selected: ' + input)
    selected = input
}

function handleValueChanged(input){
    let fieldName = input.getAttribute("field")
    let id = input.getAttribute("myID")
    console.log('hi ' + fieldName)
    getById[id].data[fieldName] = input.value
    console.log(getById[id])
}

function addToList(id){
    getById[id].data['...'].append("")

    rerender()
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