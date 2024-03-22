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
    focus: "name",
    focus2: "input"
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
    symbol: (x) => x == 1 ? "<hr>" : "",
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
        render: (data) => `${data["left"]}${symbol}${data["right"]}`,
        focus: "left",
        focus2: "right"
    }
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

let getById = {}

function create_new(type, parent, slot){
    let ret = JSON.parse(JSON.stringify(type))
    ret.id = (parent ? parent.id : '') + "." + slot

    if(slot == "..."){
        if(parent)
            parent.data[slot].push(ret)
        ret.id += "." + (parent.data[slot].length - 1)
    }else{
        if(parent)
            parent.data[slot] = ret
    }

    ret.render = type.render
    ret.symbol = type.symbol
    ret.parent = parent
    ret.slot = slot

    for(var x of type.fields){
        ret.data[x] = ''
    }

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

/*let expression = (JSON.parse(JSON.stringify(expr)) ); expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.parent = undefined
getById["top"] = expression*/

let expression = (JSON.parse(JSON.stringify(expr)) ); expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.parent = undefined
expression.data['inside'] = ''
getById["top"] = expression


function renderInput(text, field, name, objID, idx=undefined){
    // aria-label="${field} of ${name}"
    return `<input description="${field} of ${name}" tabindex="0" type="text" class="placeholder" id="${objID}.${field}" myId="${objID}" field="${field}" onfocus="amSelecting(this)" oninput="handleValueChanged(this)" value="${text}" idx=${idx} onkeydown="handleKeyDown(event, this)"/>`
}

function spacer(type, parent){
    // aria-label="before ${parent.name}" 
    return `<span aria-hidden="true" role="presentation" class="divider" tabindex=0 myId="${parent.id}" id="${parent.id}.${type}" field="${type}" onkeydown="handleKeyDown(event, this)" onfocus="amSelecting(this)"></span>`
}

function renderDiv(obj, myId="", field="", name="", idx=0){
    if (typeof obj === "string") {
        return renderInput(obj, field, name, myId, idx)
    }

    let str = `<div role="button" myId="${obj.id}" id="${obj.id}" onfocus="amSelecting(this)" aria-describedby="${obj.id}.readaloud" aria-labelledby="${obj.id}.readaloud" tabindex="0" class="block outerblock" onkeydown="handleKeyDown(event, this)">`
    str += spacer('prev', obj)

    str += `<div style="flex-direction:${obj.direction}" class="innerblock">
            ${(() => {
                var total = ""
                
                total += `<span style="width: 100%;">${obj.symbol(0)}</span>`
                for(var i = 0; i < obj.fields.length; i++){
                    if(i > 0){
                        total += `<span style="width: 100%;">${obj.symbol(i)}</span>`
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

    str += spacer('next', obj) + '</div>'

    return str
}

let selected = undefined

function amSelecting(input){
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
        console.error('warning: no node with id=' + id + ". is this an input field or a span?")
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
    input.style.minWidth = (input.value.length) + 'ch';

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

function reroot(node, parent, value, after){
    newItem = create_new(lookup[value], parent, node.slot)
    if(parent)
        parent.data[node.slot] = newItem

    let toFocusOn = newItem.focus
    if(after && newItem.focus2){
    	toFocusOn = newItem.focus2
    }

    if(lookup[value] == list){
        newItem.data['...'].push(node)
    }else{
        newItem.data[toFocusOn] = node
    }

    //console.log(newItem)

    node.parent = newItem
    node.slot = toFocusOn

    //console.log('node after changing:')
    //console.log(node)

    updateID(newItem)
    rerender(newItem)

    if(newItem.fields.length > 1){
        if(after)
            focusOnFind(newItem.id + "." + newItem.focus)
        else{
            focusOnFind(newItem.id + "." + newItem.focus2)
        }
    }else{
        focusOnFind(newItem.id + "." + toFocusOn)
    }
}

function autocompleteChanged(value) {
    //console.log('trigger:', value)

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
        //console.log('reset value')
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

        reroot(node, parent, value, false)
        return;
    }else if(selected.tagName == 'SPAN'){
        if(field == 'next'){
            let node = getById[id]
            let parent = node.parent

            reroot(node, parent, value, false)
            return;
        }else{
            let node = getById[id]
            let parent = node.parent

            reroot(node, parent, value, true)
            return;
        }
    }else{
        newItem = create_new(lookup[value], getById[id], field)
        newItem.data[newItem.focus] = selected.value
        
        getById[id].data[field] = newItem
    }

    focusOnFind(newItem.id + "." + newItem.focus, selected.selectionStart)

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

function focusOnFind(id, selectionStart=0){
    waitForElm(id).then((elm) => {
        //console.log('finished waiting')
        elm.setAttribute('focusOn', selectionStart)
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

let tone = document.getElementById('tone')
let before = document.getElementById('before')
let after = document.getElementById('after')

function play(thing){
    thing.currentTime = 0
    thing.play()
}

function switchTone(){
    play(tone)
}

function beforeTone(){
    play(before)
}

function afterTone(){
    play(after)
}


pos = 0

function shiftCaret(delta){
    if(delta == 0){
        return 0
    }

    if(selected.id == 'top.inside' && delta < 0){
        return 0;
    }

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

    let currentNode = getById[id]
    let currentField = field

    let nextNode = undefined
    let nextFieldIdx = undefined 
    let nextField = undefined

    if(delta < 0){
        // left in general
        nextNode = currentNode
        nextFieldIdx = currentNode.fields.indexOf(currentField) - 1
        if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length){
            nextField = currentNode.fields[nextFieldIdx]
        }

        if(nextNode == expression.data['inside'] && field == 'prev'){
            document.getElementById('top.inside').focus()
            switchTone()

            return -1
        }

        // left onto prev
        if(nextFieldIdx == -1){
            nextField = 'prev'
        }

        // left on next
        if(field == 'next'){
            nextNode = currentNode
            nextFieldIdx = currentNode.fields.length - 1
            nextField = currentNode.fields[nextFieldIdx]
        }else if(field == 'prev'){ //left on prev
            // go up one and then left
            nextNode = currentNode.parent
            nextFieldIdx = nextNode.fields.indexOf(currentNode.slot) - 1
            if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length){
                nextField = nextNode.fields[nextFieldIdx]
            }

            if(nextFieldIdx == -1){ //left from prev to prev
                nextField = 'prev'
            }

            /*if(nextNode == expression.data['inside']){
                nextField = 'prev'
            }*/
        }
    }else{
        // right in general
        nextNode = currentNode
        nextFieldIdx = nextNode.fields.indexOf(currentField) + 1

        if(field == 'next' && currentNode.id == 'top.inside'){
            return 0;
        }

        if(selected.id == 'top.inside'){
            document.getElementById('top.inside.prev').focus()
            beforeTone()
            return 1
        }

        if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length)
            nextField = currentNode.fields[nextFieldIdx]

        if(nextFieldIdx == nextNode.fields.length)
            nextField = 'next'

        if(field == 'prev'){ //right on prev
            nextFieldIdx = 0
            nextField = nextNode.fields[0]
        }else if(field == 'next'){ //right on next
            // go up
            nextNode = currentNode.parent
            nextFieldIdx = nextNode.fields.indexOf(currentNode.slot) + 1
            if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length)
                nextField = nextNode.fields[nextFieldIdx]

            if(nextFieldIdx == nextNode.fields.length){
                nextField = 'next'
            }
        }
    }
 
    // if we already found a selectable
    if(nextField == 'next' || nextField == 'prev' || (typeof nextNode.data[nextField] == 'string')){
        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)
        
        if(typeof nextNode.data[nextField] == 'string'){
            if(delta > 0)
                associatedInput.setAttribute('focusOn', 0)
            else
                associatedInput.setAttribute('focusOn', associatedInput.value.length)
        }

        associatedInput.focus()

        if(nextField == 'next'){
            afterTone()
        }else if(nextField == 'prev'){
            beforeTone()
        }else{
            switchTone()
        }
        return Math.sign(delta)
    }
    
    // move down until we get to either 'next' or 'prev'

    if(delta < 0){
        nextNode = nextNode.data[nextField]
        nextField = 'next'

        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)

        associatedInput.focus()

        afterTone()
    }else{
        nextNode = nextNode.data[nextField]
        nextField = 'prev'

        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)

        associatedInput.focus()

        beforeTone()
    }

    return Math.sign(delta)
}

function collapse(node){
    let totalText = ""

    //console.log(node)
    //console.log(node.data)

    for(var x of node.fields){
        //console.log(x, node.data[x])
        totalText += node.data[x]
    }
    //console.log(totalText)
    node.parent.data[node.slot] = totalText

    if(node.parent.parent)
        rerender(node.parent.parent)
    else
        rerender(node.parent)

    let newElement = document.getElementById(node.parent.id + '.' + node.slot)

    let current = node.parent

    while(current){
        updateMemoi(current)
        current = current.parent
    }

    newElement.focus()
}

/**
 * Node: the node object
 * Idx: the idx of where we have chosen to delete
 * Defined like this:
 *    field1    field2     field3
 * 0         1           2          3
 * 
 */
function deleteFrom(node, idx){
    let n = node.fields.length

    if(idx == 0){
        // delete whole thing, backspace on first
        announceMessage("deleting " + node.name)
        collapse(node)
        return
    }
    if(idx == n){// does nothing
        return
    }

    // if node has predefined delete behavior, use that
    if(node.deleteBehavior && node.deleteBehavior[idx]){
        node.deleteBehavior[idx](node)
        return;
    }

    // otherwise, do default behavior
    if(node.fields.length == 2){
        announceMessage("deleting " + node.name)
        // collapse
        collapse(node)
    }

}

function erase(node){
    node.parent.data[node.slot] = ''
    rerender(node.parent)
}

function handleKeyDown(event, input) {
    const cursorPosition = input.selectionStart;

    /*console.log('hi')
    console.log(event.key)
    console.log(input.selectionStart)*/

    if(event.key == 'Insert'){
        //narrate this element
        announceMessage(input.getAttribute('description'))
    }

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

        if(input.tagName == 'DIV' || input.tagName == 'SPAN' || cursorPosition <= 0){
            let delta = shiftCaret(-1)

            event.preventDefault()
        }

        event.stopPropagation();
    } else if (event.key === 'ArrowRight') {
        // Cursor is at the end of the input, prevent moving right
        //event.preventDefault();
        if(input.tagName == 'DIV' || input.tagName == 'SPAN' || cursorPosition >= input.value.length){
            shiftCaret(1)
            event.preventDefault()
        }
        event.stopPropagation();
    }

    if(event.key == 'Backspace' && (input.tagName == 'SPAN' || input.selectionEnd == 0)){
        event.preventDefault()
        event.stopPropagation()

        // backspace
        let id = input.id // id of element including field
        let myId = input.getAttribute("myid") // id of parent element
        let field = input.getAttribute("field")

        let node = getById[myId]

        if(field=="next"){
            erase(node)
            return
        }

        let idx = node.fields.indexOf(field)

        deleteFrom(node, idx)
    }else if(event.key == 'Delete' && (input.tagName == 'SPAN' || input.selectionStart == input.value.length)){
        event.preventDefault()
        event.stopPropagation()

        // delete
        let id = input.id // id of element including field
        let myId = input.getAttribute("myid") // id of parent element
        let field = input.getAttribute("field")

        let node = getById[myId]

        if(field=="next"){
            shiftCaret(1)
            erase(getById[selected.getAttribute('myid')])
            return
        }

        let idx = node.fields.indexOf(field) + 1

        deleteFrom(node, idx)
    }
}

function announceMessage(message) {
    var alertDiv = document.getElementById('screenReaderAlert');
    alertDiv.textContent = message;
}

function getlatex(){
    alert(renderLaTeX(expression))
}