let autocomplete = document.getElementById("autocomplete")
let equation_picker = document.getElementById("equation-picker")

function handleSpatial(event){
    event.preventDefault()
    event.stopPropagation()

    let loc = getLocation(event.key, event.code)

    if(!loc){
        return
    }

    let p = loc

    //console.log(event.key)
    //console.log(event.code)

    //console.log(x, y)

    const topInputs = document.querySelectorAll('input[id^="top"]')
    const {left, top, right, bottom} = document.getElementById('top').getBoundingClientRect()
    const totalsize = {
        x: right - left,
        y: bottom - top
    }

    // transform keyboard coords to actual coords, and move blue circle accordingly
    const blueCirc = document.getElementById('bluecirc')
    blueCirc.style.left = (p.x * totalsize.x) + "px"; // Set the left position
    blueCirc.style.top = (p.y * totalsize.y) + "px";   // Set the top position

    const rects = inputsToRects(topInputs)

    // transform rect coordinates
    for(var r of rects){
        r.min.x -= left
        r.min.y -= top
        r.max.x -= left
        r.max.y -= top

        r.min.x /= totalsize.x
        r.min.y /= totalsize.y
        r.max.x /= totalsize.x
        r.max.y /= totalsize.y
    }

    //console.log('Input rectangles:', rects)
    //console.log(p)

    var best = 0
    var bestDist = 999999
    var count = 0
    
    for(var r of rects){
        let dist = distance(r, p)

        if(dist < bestDist){
            best = count
            bestDist = dist
        }

        count++
    }

    // isSpatialMode = false
    topInputs[best].focus()

    {
        // play piano sound

        // get total number of input fields
        let myDiv = document.getElementById("blocks");
        let inputFields = myDiv.getElementsByTagName("input");
        let inputCount = inputFields.length

        //console.log('inputCount', inputCount)

        let id = topInputs[best].getAttribute('myId')
        let field = topInputs[best].getAttribute('field')
        let node = getById[id]

        let numBefore = getNumBefore(node, field)

        //create a synth and connect it to the main output (your speakers)
        const synth = new Tone.Synth().toDestination();
        const now = Tone.now();

        //play a middle 'C' for the duration of an 8th note

        //console.log('playing notes:', 'A3', 'A3 shifted ' + numBefore, 'A3 shifted ' + inputCount)
        //console.log('A3', shiftTone("A3", numBefore), shiftTone("A3", inputCount - 1))

        synth.triggerAttackRelease("A3", "8n", now);
        synth.triggerAttackRelease(shiftTone("A3", numBefore), "8n", now + 0.5);
        synth.triggerAttackRelease(shiftTone("A3", inputCount - 1), "8n", now + 1);
    }
}

let isSpatialMode = false
let wasFocused = undefined
document.addEventListener("keydown", function(event) {
    //console.log('THIS KEYCODE:', event.code)
    // read aloud
    if (event.ctrlKey && event.altKey && event.code == "BracketLeft"){
        announceMessage(genAriaLabel(renderLaTeX(expression)))
    }

    if (event.ctrlKey && event.altKey && event.code == "BracketRight"){
        announceMessage(genRead(expression))
    }

    // Load element picker
    if (event.ctrlKey && event.code === "Space") {
        equation_picker = document.getElementById("equation-picker")
        autocomplete.classList.remove("hidden")
        wasFocused = document.activeElement

        equation_picker.focus()

        if (selected && selected.tagName && selected.tagName.toLowerCase() === 'input' && selected.type.toLowerCase() === 'text'){
            let text = selected.value
            let doneOnce = false

            setTimeout(() => {
                equation_picker.value = text
            }, 50)

            // copy text over from current input field into equation picker
            /*equation_picker.addEventListener('focus', function() {
                // Call your function when the input element receives focus
                if(!doneOnce){
                    doneOnce = true

                    equation_picker.value = text
                }
            });*/
        }
    }
    if(event.code == "Escape"){
        // leave select
        autocomplete.classList.add("hidden")
        if(wasFocused) wasFocused.focus()

        // enter spatial navigation mode
        if(event.metaKey){
            isSpatialMode = !isSpatialMode
        }
    }

    if(isSpatialMode){
        handleSpatial(event)
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
    ret.readaloud = type.readaloud
    ret.parent = parent
    ret.slot = slot

    for(var x of type.fields){
        ret.data[x] = ''
    }

    getById[ret.id] = ret

    return ret
}

function updateID(node, parentId=""){
    if(parentId != ""){
        node.id = parentId + '.' + node.slot
    }
    getById[node.id] = node

    for(var field of node.fields){
        if(node.data[field] && typeof node.data[field] != 'string'){
            // another node
            node.data[field].slot = field
            node.data[field].parent = node
            updateID(node.data[field], node.id)
        }
    }
}

let expression = (JSON.parse(JSON.stringify(expr)) ); expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.readaloud = expr.readaloud
expression.parent = undefined
expression.data['inside'] = ''
getById["top"] = expression


function renderInput(text, field, name, objID, idx=undefined){
    // aria-label="${field} of ${name}"
    // input.style.minWidth = (input.value.length) + 'ch';
    return `<input style="min-width: ${text.length}ch" autocomplete="off" description="${field} of ${name}" tabindex="0" type="text" class="placeholder" id="${objID}.${field}" myId="${objID}" field="${field}" onfocus="amSelecting(this)" oninput="handleValueChanged(this)" value="${text}" idx=${idx} onkeydown="handleKeyDown(event, this)"/>`
}

function spacer(type, parent, symbol, readaloud){
    // aria-label="before ${parent.name}" role="presentation"
    return `<span role="presentation" custom-label="${readaloud}" class="separator divider" tabindex=-1 myId="${parent.id}" id="${parent.id}.${type}" field="${type}" onkeydown="handleKeyDown(event, this)" onfocus="amSelecting(this)">${symbol}</span>`
}

function makeSymbolSpan(symbol, parent, idx, readaloud){
    if(!symbol || symbol == ''){
        return ``
    }
    // role="presentation"
    return `<span tabindex="-1" aria-hidden="true" role="presentation" custom-label="${readaloud}" class="separator" myId="${parent.id}" id="${parent.id}.separator${idx}" field="separator${idx}" onkeydown="handleKeyDown(event, this)" onfocus="amSelecting(this)">${symbol}</span>`
}

function renderDiv(obj, myId="", field="", name="", idx=0){
    if (typeof obj === "string") {
        return renderInput(obj, field, name, myId, idx)
    }

    // 
    // DONT include tabindex=0, causes weird bugs with not reading individual characters in input field
    let str = `<div myId="${obj.id}" id="${obj.id}" onfocus="amSelecting(this)" class="block outerblock" aria-describedby="${obj.id}.readaloud" aria-labelledby="${obj.id}.readaloud" role="button" onkeydown="handleKeyDown(event, this)">`
    str += spacer('prev', obj, obj.symbol(0), obj.readaloud(0))

    str += `<div style="flex-direction:${obj.direction}" class="innerblock">
            ${(() => {
                var total = ""
                
                // we move the first symbol onto prev
                // total += makeSymbolSpan(obj.symbol(0), obj, 0)
                //`<span style="width: 100%;">${obj.symbol(0)}</span>`
                for(var i = 0; i < obj.fields.length; i++){
                    if(i > 0){
                        total += makeSymbolSpan(obj.symbol(i), obj, i, obj.readaloud(i))
                        //`<span style="width: 100%;">${obj.symbol(i)}</span>`
                    }
                    let field = obj.fields[i]
                    if(field == "..."){
                        //console.log('render here')
                        for(var j = 0; j < obj.data["..."].length; j++){
                            if(j > 0){
                                total += makeSymbolSpan(obj.symbol(j), obj, j, obj.readaloud(j))
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
                // we move the last symbol onto prev as well
                //if(obj.name != "list")
                //    total += makeSymbolSpan(obj.symbol(obj.fields.length), obj, obj.fields.length)//`<span>${obj.symbol(obj.fields.length)}</span>`

                return total
            })()}
        </div>`

    str += spacer('next', obj, obj.symbol(obj.fields.length), obj.readaloud(obj.fields.length)) + '</div>'

    return str
}

let selected = undefined

function amSelecting(input){
    let focusOn = input.getAttribute('focusOn')

    // console.log(input.tagName, input)
    if(input.tagName == 'SPAN'){
        announceMessage(input.getAttribute('custom-label'))
    }

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
        //console.log('node ' + node.id + ' has parent, go up one level', node)
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

function genRead(expression){
    let str = ""

    for(var i = 0; i <= expression.fields.length; i++){
        str += " " + expression.readaloud(i) + " "
        if(i < expression.fields.length){
            let child = expression.data[expression.fields[i]]
            if(typeof child == 'string'){
                str += child
            }else{
                str += genRead(child)
            }
        }
    }

    return str
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

/** 
 * Gets first edible field, given a node
 * and a direction, specified in dir and
 * given through NodeDirection in `constants.js`
 * 
 * E.g. if dir == RIGHT, then it will find the
 * leftmost editable field in node
 */
function getNext(node, dir){
    let parent = node
    let current = node
    let idx = dir == NodeDirection.LEFT ? 0 : -1

    while(current && typeof current !== 'string'){
        //console.log('current', current)

        let index = mod(idx, current.fields.length)
        parent = current
        current = current.data[current.fields[index]]
    }

    return {
        node: parent,
        idx: mod(idx, parent.fields.length),
        slot: parent.fields[mod(idx, parent.fields.length)]
    }
}

let currIdx = 0

/**
 * shifts the caret delta units to the left or right,
 * left is negative, right is positive
 * 
 * Includes shifting into begin/end, as well as onto separators
 * @param {int} delta 
 * @returns the amount of shift
 */
function shiftCaret(delta){
    /* ignore null shifts */
    if(delta == 0){
        return 0
    }

    /* don't shift left past the beginning */
    if(selected.id == 'top.inside' && delta < 0){
        return 0;
    }

    /* handle case where |delta| > 1-- just repeat one-unit shifts multiple times */
    if(Math.abs(delta) > 1){
        let cnt = 0

        for(var i = 0; i != delta; i += Math.sign(delta)){
            let chng = shiftCaret(Math.sign(delta))
            cnt += chng

            if(chng == 0){
                return cnt
            }
        }
        return cnt;
    }

    let id = selected.getAttribute('myID')
    let field = selected.getAttribute('field')

    let currentNode = getById[id]
    let currentField = field

    // the fields we need to define/instantiate
    // in the if-statement below
    let nextNode = undefined
    let nextFieldIdx = undefined 
    let nextField = undefined

    /* shift left or right */
    if(delta < 0){
        // left in general
        nextNode = currentNode

        // this is a separator, go onto field
        if(field.includes('separator')){
            // get index of separator
            let separatorIdx = field.substring(field.indexOf("separator") + "separator".length)

            // if we're on a separator (not prev or next), we can
            // guarantee that this is the next field idx if we're going
            // left
            let fieldIdx = separatorIdx - 1

            nextFieldIdx = fieldIdx
            nextField = currentNode.fields[nextFieldIdx]
        }else{ // we're on a field, go onto separator
            // field of separator is same as field of item when going left
            nextFieldIdx = currentNode.fields.indexOf(currentField)
            nextField = `separator${nextFieldIdx}`

    
            if(nextNode == expression.data['inside'] && field == 'prev'){
                //document.getElementById('top.inside').focus()
                //switchTone()
                return -1
            }
    
            // left onto prev
            // keyword: onTO
            if(nextFieldIdx == 0){
                nextField = 'prev'
            }
    
            // left on next
            if(field == 'next'){
                nextNode = currentNode
                nextFieldIdx = currentNode.fields.length - 1
                nextField = currentNode.fields[nextFieldIdx]
            }else if(field == 'prev'){ //left on prev-- keyword ON
                // go up one and then left
                nextNode = currentNode.parent
                nextFieldIdx = nextNode.fields.indexOf(currentNode.slot)// - 1
                nextField = `separator${nextFieldIdx}`
                /*if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length){
                    nextField = nextNode.fields[nextFieldIdx]
                }*/
    
                if(nextFieldIdx == 0){//-1){ //left from prev to prev
                    nextField = 'prev'
                }
            }
        }
    }else{
        // right in general
        nextNode = currentNode

        // this is a separator, go onto field
        if(field.includes('separator')){
            // get index of separator
            let separatorIdx = field.substring(field.indexOf("separator") + "separator".length)

            // if we're on a separator (not prev or next), we can
            // guarantee that this is the next field idx if we're going
            // right
            let fieldIdx = separatorIdx

            nextFieldIdx = fieldIdx
            nextField = currentNode.fields[nextFieldIdx]
        }else{
            // this is a field, go onto separator
            nextFieldIdx = nextNode.fields.indexOf(currentField) + 1

            // don't allow going next on root node
            if(field == 'next' && currentNode.id == 'top.inside'){
                return 0;
            }

            // this is outdated, from going right on the leftmost "highlight all"
            // node
            if(selected.id == 'top.inside'){
                document.getElementById('top.inside.prev').focus()
                beforeTone()
                return 1
            }

            nextField = `separator${nextFieldIdx}`
            //if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length)
            //    nextField = currentNode.fields[nextFieldIdx]

            // right onTO next
            if(nextFieldIdx == nextNode.fields.length)
                nextField = 'next'

            if(field == 'prev'){ //right ON prev
                nextFieldIdx = 0
                nextField = nextNode.fields[0]
            }else if(field == 'next'){ //right ON next
                // go up
                nextNode = currentNode.parent
                nextFieldIdx = nextNode.fields.indexOf(currentNode.slot) + 1
                nextField = `separator${nextFieldIdx}`
                //if(nextFieldIdx >= 0 && nextFieldIdx < nextNode.fields.length)
                //    nextField = nextNode.fields[nextFieldIdx]

                if(nextFieldIdx >= nextNode.fields.length){
                    nextField = 'next'
                }
            }
        }
    }
 
    // if we already found a selectable, then focus on that element,
    // and adjust the cursor position as well

    /*console.log(nextNode)
    console.log(nextField)
    console.log(nextNode.id + '.' + nextField)*/

    // also handle HCI components like playing tones and whatnot
    if(nextField == 'next' || nextField == 'prev' || nextField.includes('separator') || (typeof nextNode.data[nextField] == 'string')){
        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)
        
        if(typeof nextNode.data[nextField] == 'string'){
            if(delta > 0){
                if(associatedInput.value[0])
                    announceMessage(associatedInput.value[0])
                associatedInput.setAttribute('focusOn', 0)
            }else
                associatedInput.setAttribute('focusOn', associatedInput.value.length)
        }

        associatedInput.focus()

        if(nextField == 'next'){
            afterTone()
        }else if(nextField == 'prev'){
            beforeTone()
        }else if(!nextField.includes('separator')){
            switchTone()
        }

        return Math.sign(delta)
    }
    
    // otherwise, move down until we get to our next selectable-- 
    // either 'next' or 'prev'
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

/** Returns the other idx, that is
 *  not the one we're currently on
 */
function not(node, idx){
    if(node.fields.length != 2){
        console.error("warning: not used when shouldn't have been", idx, node)
        return idx;
    }
    return 1 - idx;
}

// collapse means take whatever was
// in this text field, and append it onto
// whatever remains
function collapse(node, idx){
    let currText = node.data[node.fields[idx]]
    //console.log('currText:', currText)

    let opp = not(node, idx)
    //console.log(opp, node.data[node.fields[opp]], node, node.parent)
    node.parent.data[node.slot] = node.data[node.fields[opp]]

    let startingNode = node.parent
    let ourSlot = undefined
    let cursorPos = 0

    if (idx < opp){
        // append on rightmost
        let {node, slot, idx} = getNext(startingNode, NodeDirection.RIGHT)

        node.data[slot] = currText + node.data[slot]
        cursorPos = currText.length

        startingNode = node
        ourSlot = slot
    }else{
        // append on leftmost
        let {node, slot, idx} = getNext(startingNode, NodeDirection.RIGHT)

        node.data[slot] += currText
        cursorPos = node.data[slot].length - currText.length

        startingNode = node
        ourSlot = slot
    }

    //console.log('start updating ID')
    updateID(expression, "")
    //console.log('finish updating ID')

    //console.log('start rerender')
    if(startingNode.parent)
        rerender(startingNode.parent)
    else
        rerender(startingNode)
    //console.log('end rerender')

    //console.log('new element:', startingNode.id + '.' + ourSlot)
    let newElement = document.getElementById(startingNode.id + '.' + ourSlot)
    newElement.setAttribute('focusOn', cursorPos)

    //updateMemoi(startingNode)

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
    //console.log('delete from: ', node, idx)
    let n = node.fields.length

    // top level element, don't delete
    if(node.id == 'top'){
        return
    }

    if(idx == 0){
        // delete whole thing, backspace on first
        announceMessage("deleting " + node.name)
        collapse(node, idx)
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
        collapse(node, idx)
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

    if(event.ctrlKey && event.altKey && event.key == 'Insert'){
        //narrate this element
        console.log(input)
        announceMessage(input.value)
    }

    /**
     * Up and down-- move from one node to the next
     */
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
        //console.log('arrow left', input.tagName, cursorPosition)

        if(input.tagName == 'DIV' || input.tagName == 'SPAN' || cursorPosition <= 0){
            let delta = shiftCaret(-1)

            event.preventDefault()
            event.stopImmediatePropagation()
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
        if(isSpatialMode){
            return
        }
        event.preventDefault()
        //event.stopPropagation()

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
    if(!message)
        return
    //console.log('announcing:', message)

    var alertDiv = document.getElementById('screenReaderAlert');
    var log = document.getElementById('announcementLog')
    alertDiv.textContent = message;

    setTimeout(() => {alertDiv.textContent = ""; log.innerHTML = message + '<br>' + log.innerHTML}, 50)
}

function getlatex(){
    let text = (renderLaTeX(expression))

    navigator.clipboard.writeText(text)
        .then(() => {
            announceMessage("Copied LaTeX to clipboard!")
        })
        .catch(err => {
            announceMessage('Could not copy text: ', err);
        });
}