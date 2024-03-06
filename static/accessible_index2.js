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

let oldTime = 0

accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#equation-picker'),
    // additional options
    onConfirm: (value) => {
        // time is necessary or else it will trigger twice in a row
        const currentTimeMillis = new Date().getTime();

        if(currentTimeMillis - oldTime > 250){
            oldTime = currentTimeMillis
            
            autocompleteChanged(value)
            //console.log('stuff: ', value)
            
        }
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
    render: (data) => `${data["left"]}+${data["right"]}`,
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
    ret.slot = slot

    getById[ret.id] = ret

    return ret
}

function updateID(node, parentId=""){
    if(parentId != "")
        node.id = parentId + '.' + node.slot
    getById[node.id] = node

    for(var field of node.fields){
        if(node.data[field] && typeof node.data[field] != 'string'){
            // another node
            updateID(node.data[field], node.id)
        }
    }
}

let expression = (JSON.parse(JSON.stringify(expr)) ); expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.parent = undefined
getById["top"] = expression


function renderInput(text, field, name, objID, idx=undefined){
    return `<input aria-label="${field} of ${name}" tabindex="0" type="text" class="placeholder" id="${objID}.${field}" myId="${objID}" field="${field}" onfocus="amSelecting(this)" onchange="handleValueChanged(this)" oninput="this.style.width = (this.value.length) + 'ch';" value="${text}" idx=${idx} onkeydown="handleKeyDown(event, this)"/>`
}

function renderDiv(obj, myId="", field="", name="", idx=0){
    if (typeof obj === "string") {
        return renderInput(obj, field, name, myId, idx)
    }

    let str = 
        `<div myId="${obj.id}" id="${obj.id}" onfocus="amSelecting(this)" aria-describedby="${obj.id}.readaloud" aria-labelledby="${obj.id}.readaloud" tabindex="0" class="block" style="flex-direction:${obj.direction}" onkeydown="handleKeyDown(event, this)">
            ${(() => {
                var total = ""
                total += `<span style="width: 100%; height: 100%;">${obj.symbol(0)}</span>`
                for(var i = 0; i < obj.fields.length; i++){
                    if(i > 0){
                        total += `<span style="width: 100%; height: 100%;">${obj.symbol(i)}</span>`
                    }
                    let field = obj.fields[i]
                    if(field == "..."){
                        //console.log('render here')
                        for(var j = 0; j < obj.data["..."].length; j++){
                            if(j > 0){
                                total += `<span>${obj.symbol(j)}</span>`
                            }
                            //console.log('subrender: ' + obj.data["..."][j] + " " + obj.id + " " + j)
                            total += renderDiv(obj.data["..."][j], obj.id, '...', 'list', j)
                        }
                        total += `<button tabindex="0" id="${obj.id}.button" myId="${obj.id}" onclick="addToList('${obj.id}')">+</button>`
                    }else{
                        if(obj.data[field]){
                            total += renderDiv(obj.data[field], obj.id, field, obj.name)
                        }else{
                            //console.log('this is our id: ' + obj.id)
                            total += renderInput('', field, obj.name, obj.id)
                            //total += `<input aria-label="${field} of ${obj.name}" tabindex="0" type="text" class="placeholder" id="${obj.id}.${field}" myId="${obj.id}" field="${field}" onfocus="amSelecting(this)" onchange="handleValueChanged(this)" oninput="this.style.width = (this.value.length) + 'ch';"/>`
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
    // if selected exists, update aria label
    /*console.log('was selecting: ')
    console.log(input)
    console.log('now selecting: ')
    console.log(input)*/

    let focusOn = input.getAttribute('focusOn')

    if(focusOn){
        input.setSelectionRange(focusOn, focusOn)
        input.removeAttribute('focusOn')
    }

    if(selected){
        updateAriaLabel(selected)
    }

    //input.style.background = "black"
    //console.log('selected: ')
    //console.log(input)

    //console.log('labeled by: ' + input.getAttribute("aria-labelledby"))
    //console.log(document.getElementById(input.getAttribute("aria-labelledby")))
    selected = input
}

function updateRec(id){
    let node = getById[id]

    if(!node){
        return;
    }

    let readaloudID = id + ".readaloud"
    let readaloudElem = document.getElementById(readaloudID)

    let latex = renderLaTeX(node)
    let label = genAriaLabel(latex, readaloudID)

    //console.log(latex)
    //console.log(label)

    if(!readaloudElem){
        let elem = document.createElement("div");
        elem.id = readaloudID
        elem.style.display = 'none'

        if(typeof label == 'string')
            elem.innerHTML = label
        else
            elem.innerHTML = label.outerHTML

        hiddenreadalouds.appendChild(elem)
    }else{
        if(typeof label == 'string')
            readaloudElem.innerHTML = label
        else
        readaloudElem.innerHTML = label.outerHTML

        //console.log("new HTML: " + readaloudElem.innerHTML)
    }

    if(node.parent){
        //console.log('node ' + node.id + ' has parent, go up one level')
        updateRec(node.parent.id)
    }
}

let hiddenreadalouds = undefined

function updateAriaLabel(selected){
    hiddenreadalouds = document.getElementById("hiddenreadalouds")

    if(selected.nodeName == 'INPUT'){
        let id = selected.getAttribute("myID")

        if(!id){
            console.log("Don't update")
            return
        }
        updateRec(id)
    }
}

function genAriaLabel(latex, id){
    if(!latex || latex.length == 0){
        return ""
    }

    let mathml = MathJax.tex2mml(latex)

    return SRE.toSpeech(mathml)
}

function handleValueChanged(input){
    let fieldName = input.getAttribute("field")
    let id = input.getAttribute("myID")
    getById[id].data[fieldName] = input.value

    updateMemoi(getById[id])
}

function addToList(id){
    let new_list_item = create_new(expr, getById[id], "...")

    let divStr = renderDiv(new_list_item)
    let item = document.createElement("div")
    item.innerHTML = divStr

    let sep = document.createElement("span")
    sep.innerHTML = ","

    if(new_list_item.parent.data['...'].length > 1)
    document.getElementById(id).insertBefore(sep, document.getElementById(id + '.button'))
    document.getElementById(id).insertBefore(item, document.getElementById(id + '.button'))

    rerender(new_list_item)

    focusOnFind(id + "." + '...' + '.' + (getById[id].data['...'].length - 1) + ".inside")
}

function rerender(item_changed){
    updateMemoi(item_changed)

    let id = document.getElementById(item_changed.id)

    // this was causing bugs-- make sure it's not a problem in the future!
    if(id)
        id.outerHTML = renderDiv(item_changed)
}

function autocompleteChanged(value) {
    console.log('trigger:', value)

    if(!selected){
        alert("No field selected! Don't know where to put this")
        return;
    }

    if(value == ""){
        return;
    }

    //console.log('autocomplete changed')

    autocomplete.classList.add("hidden")
    if(wasFocused) wasFocused.focus()

    document.getElementById("emptySelection").selected = true
    setTimeout(() => {
        console.log('reset value')
        equation_picker.value = ""
    }, 250)

    const selectedValue = value;
    // Perform actions based on the selected value
    //console.log("Picked:", selectedValue);

    let field = selected.getAttribute("field")
    let id = selected.getAttribute("myId")

    let newItem = undefined

    if(!field){
        // this is an outer div
        //if this is 
        let node = getById[id]
        let parent = node.parent

        //console.log('add to this node:')
        //console.log(node)

        newItem = create_new(lookup[value], parent, node.slot)
        parent.data[node.slot] = newItem
        if(lookup[value] == list){
            newItem.data['...'].push(node)
        }else{
            newItem.data[newItem.focus] = node
        }

        //console.log(newItem)

        node.parent = newItem
        node.slot = newItem.focus

        //console.log('node after changing:')
        //console.log(node)

        updateID(newItem)
        rerender(newItem)

        if(newItem.fields.length > 1)
            focusOnFind(newItem.id + "." + newItem.fields[1])
        else
            focusOnFind(newItem.id + "." + newItem.focus)
        return;
    }else{
        newItem = create_new(lookup[value], getById[id], field)
        newItem.data[newItem.focus] = selected.value
        
        getById[id].data[field] = newItem
    }

    focusOnFind(newItem.id + "." + newItem.focus)

    /*console.log('rerender adding new item')
    console.log('selection is: ' + value)
    console.log('item is: ')
    console.log(newItem)*/
    rerender(newItem)
    //document.getElementById().focus()
}

focusOnFind(expression.id + "." + expression.focus)

//render expression
let blocks = document.getElementById("blocks")
blocks.innerHTML = renderDiv(expression)

function updateMemoi(element){
    if(!element){
        return ""
    }

    if(typeof element === 'string'){
        return element
    }

    let vals = {}
    for(var x of element.fields){
        vals[x] = renderLaTeX(element.data[x])
    }

    element.memoi = element.render(vals)

    if(element.parent)
        updateMemoi(element.parent)
}

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

    return element.memoi
}

function focusOnFind(id){
    waitForElm(id).then((elm) => {
        //console.log('finished waiting')
        elm.focus()
    })
}


/* Helper functions for below */
function inputToNode(input){
    return getById[input.getAttribute('myID')]
}

function nodeToInput(node){
    return document.getElementById(node.id)
}

/* Code to handle key down and moving caret */
function floormod(a, b) {
    return ((a % b) + b) % b;
}

pos = 0

function shiftCaret(delta){
    if(Math.abs(delta) > 1){
        let cnt = 0

        for(var i = 0; i != delta; i += Math.sign(delta)){
            let chng = shiftCaret(Math.sign(delta))
            cnt += chng

            if(chng = 0){
                return cnt
            }
        }
        return cnt;
    }

    let id = selected.getAttribute('myID')
    let field = selected.getAttribute('field')

    // pre-order traversal
    // actually i guess this is more of a shrub than a tree-- still pre-order traversal

    if(!field && delta < 0)
        return 0

    let currentNode = getById[id]
    let currentField = field

    //console.log('-----------')
    //console.log('starting at: ' + id)
    //console.log(currentNode)

    // find next input to go left on
    let offset = delta < 0 ? 0 : 99999
    while(currentNode.fields.indexOf(currentField) == Math.min(offset, currentNode.fields.length - 1)){
        currentField = currentNode.slot
        currentNode = currentNode.parent

        //console.log('next node')
        //console.log(currentNode)

        // we're at the root node, but there's only one editable field
        if(!currentNode){
            return 0
        }
    }

    //console.log('went up to')
    //console.log(currentNode)

    // if we can't move left/right-- we're already at the leftmost node
    if(currentNode.fields.length <= 1){
        return 0
    }

    // move
    let nextFieldIdx = (currentNode.fields.indexOf(currentField) + delta) % currentNode.fields.length
    let nextField = currentNode.fields[nextFieldIdx]
    let nextNode = currentNode.data[nextField]

    /*console.log('next field idx')
    console.log(nextFieldIdx)
    console.log(nextField)
    console.log(nextNode)

    console.log('current node')
    console.log(currentNode)*/

    // move down until we get an editable field
    let offset2 = delta < 0 ? -1 : 0
    while(typeof nextNode != 'string' && nextNode){
        let numSlots = nextNode.fields.length
        nextField = nextNode.fields[(numSlots + offset2) % numSlots]

        if(!nextNode.data[nextField] || typeof nextNode.data[nextField] == 'string'){
            currentNode = nextNode
        }

        nextNode = nextNode.data[nextField]
    }

    // blank input field
    nextNodeId = currentNode.id + '.' + nextField

    //console.log(nextNodeId)

    let associatedInput = document.getElementById(nextNodeId)

    if(delta > 0)
        associatedInput.setAttribute('focusOn', 0)
    else
        associatedInput.setAttribute('focusOn', associatedInput.value.length)

    associatedInput.focus()

    return Math.sign(delta)
}

function handleKeyDown(event, input) {
    const cursorPosition = input.selectionStart;

    /*console.log('hi')
    console.log(event.key)
    console.log(input.selectionStart)*/

    if(event.key == 'ArrowUp'){
        let delta = shiftCaret(-1)

        if(delta == 0){
            document.getElementById('top.inside').focus()
        }

        event.stopPropagation();
        event.preventDefault()
    }else if(event.key == 'ArrowDown'){
        shiftCaret(1)
        event.stopPropagation();
        event.preventDefault()
    }

    if (event.key === 'ArrowLeft') {
        // Cursor is at the beginning of the input, prevent moving left
        //event.preventDefault();

        if(input.tagName == 'DIV' || cursorPosition <= 0){
            let delta = shiftCaret(-1)

            if(delta == 0){
                document.getElementById('top.inside').focus()
            }

            event.preventDefault()
        }

        event.stopPropagation();
    } else if (event.key === 'ArrowRight') {
        // Cursor is at the end of the input, prevent moving right
        //event.preventDefault();
        console.log(input.tagName)

        if(input.tagName == 'DIV' || cursorPosition >= input.value.length){
            shiftCaret(1)
            event.preventDefault()
        }
        event.stopPropagation();
    }
}