let autocomplete = document.getElementById("autocomplete")
let equation_picker = document.getElementById("equation-picker")

// true/false for row/col
let spatialNavMode = true
function handleSpatial(event){
    event.preventDefault()
    event.stopPropagation()

    let loc = getLocation(event.key, event.code)

    if(!loc){
        return
    }

    let p = loc

    const topInputs = document.querySelectorAll('input[id^="top"]')
    
    let boundaryid = 'top'
    if(document.getElementById('top.inside')){
        boundaryid = 'top.inside'
    }

    let {left, top, right, bottom} = document.getElementById(boundaryid).getBoundingClientRect()
    const totalsize = {
        x: right - left,
        y: bottom - top
    }

    // transform keyboard coords to actual coords, and move blue circle accordingly
    const blueCirc = document.getElementById('bluecirc')
    blueCirc.style.left = (p.x * totalsize.x + left) + "px"; // Set the left position
    blueCirc.style.top = (p.y * totalsize.y + top) + "px";   // Set the top position

    let rects = inputsToRects(topInputs)

    // transform rect coordinates
    var i = 0
    for(var r of rects){
        r.min.x -= left
        r.min.y -= top
        r.max.x -= left
        r.max.y -= top

        r.min.x /= totalsize.x
        r.min.y /= totalsize.y
        r.max.x /= totalsize.x
        r.max.y /= totalsize.y

        r.idx = i

        i += 1
    }

    // filter out only rects in this current row/col
    // true corresponds to row, false to col
    if(spatialNavMode){
        let closestYDist = rects.reduce((acc, c) => {
            return Math.min(acc, pt2SegDist(p.y, c.min.y, c.max.y))
        }, 99999)
        console.log(closestYDist)
        rects = rects.filter(
            (r) => pt2SegDist(p.y, r.min.y, r.max.y) <= closestYDist)
        rects = rects.sort((a, b) => a.y - b.y)
    }else{
        // we do this in order to make sure that the set is nonempty
        let closestXDist = rects.reduce((acc, c) => {
            return Math.min(acc, pt2SegDist(p.x, c.min.x, c.max.x))
        }, 99999)
        rects = rects.filter(
            (r) => pt2SegDist(p.x, r.min.x, r.max.x) <= closestXDist)
        rects = rects.sort((a, b) => a.x - b.x)
    }

    var best = 0
    var bestDist = 999999
    var count = 0
    var bestCnt = 0
    
    for(var r of rects){
        let dist = distance(r, p)

        if(dist < bestDist){
            best = r.idx
            bestCnt = count
            bestDist = dist
        }
        
        count += 1
    }

    // isSpatialMode = false
    focusElem(topInputs[best])

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

        //let numBefore = getNumBefore(node, field)

        announceMessage(topInputs[best].getAttribute('description') + ' ' + getField(topInputs[best]).getValue())

        console.log('play sounds:', rects.length, bestCnt)

        //create a synth and connect it to the main output (your speakers)
        const synth = new Tone.Synth().toDestination();
        const now = Tone.now();

        //play a middle 'C' for the duration of an 8th note

        //console.log('playing notes:', 'A3', 'A3 shifted ' + numBefore, 'A3 shifted ' + inputCount)
        //console.log('A3', shiftTone("A3", numBefore), shiftTone("A3", inputCount - 1))

        synth.triggerAttackRelease("A3", "16n", now);
        synth.triggerAttackRelease(shiftTone("A3", rects.length - 1), "16n", now + 0.25);
        synth.triggerAttackRelease(shiftTone("A3", bestCnt), "16n", now + 0.5);
    }
}

let isSpatialMode = false
let isLiteralMode = false
let wasFocused = undefined

let lastPressedCode = 0

document.addEventListener("keydown", function(event) {
    //console.log('THIS KEYCODE:', event.code)
    // read aloud
    let currentPressedCode = 0
    if (event.altKey && event.code == "BracketLeft"){
        currentPressedCode = 1

        let toGen = expression
        if(!event.ctrlKey){
            let id = selected.getAttribute('myID')        
            let currentNode = getById[id]

            toGen = currentNode
        }

        let mathspeak = genAriaLabel(renderLaTeX(toGen))
        announceMessage(mathspeak)

        if(currentPressedCode == lastPressedCode)
            putInBuffer(mathspeak)
    }

    if (event.altKey && event.code == "BracketRight"){
        currentPressedCode = 2

        let toGen = expression
        if(!event.ctrlKey){
            let id = selected.getAttribute('myID')        
            let currentNode = getById[id]

            toGen = currentNode
        }

        let intuitive = genRead(toGen)
        announceMessage(intuitive)

        if(currentPressedCode == lastPressedCode)
            putInBuffer(intuitive)
    }

    lastPressedCode = currentPressedCode

    if (event.ctrlKey && event.altKey && event.code == "KeyL"){
        isLiteralMode = !isLiteralMode
    }

    // Load element picker
    if (event.ctrlKey && event.code === "Space") {
        equation_picker = document.getElementById("equation-picker")
        autocomplete.classList.remove("hidden")
        wasFocused = document.activeElement

        equation_picker.focus()

        if (selected && selected.tagName && selected.tagName.toLowerCase() === 'input' && selected.type.toLowerCase() === 'text'){
            let text = selected.value

            let tokens = tokenizeWithSymbols(text)
            let lastToken = tokens[tokens.length - 1]

            equation_picker.value = lastToken

            setTimeout(() => {
                equation_picker.value = lastToken
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
    if(event.code == "Backquote"){
        // leave select
        autocomplete.classList.add("hidden")
        if(wasFocused) wasFocused.focus()

        // enter spatial navigation mode
        if(event.shiftKey){
            // if not in spatial, start in spatial
            if(!isSpatialMode){
                isSpatialMode = !isSpatialMode
                spatialNavMode = true
                announceMessage("Spatial navigation activated: row mode")
            }else{
                // if already in spatial, then cycle row -> col -> off
                if(!spatialNavMode){
                    isSpatialMode = false
                    announceMessage("Spatial navigation off")
                    event.preventDefault()
                }else{
                    announceMessage("Spatial navigation activated: column mode")
                    spatialNavMode = false
                }
            }
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
        if(parent){
            //console.log('this is the slot:', slot)
            //console.log('this is ret:', ret)
            parent.data[slot] = ret
            //console.log('change parent here:', parent)
            //console.log(expression)
            //console.log('parent of parent = expression', parent.parent == expression)
        }
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

let expression = JSON.parse(JSON.stringify(expr))/*new Observer(JSON.parse(JSON.stringify(expr)), e=>{
    if(e.keyPath.includes('data.inside')){
        console.log(e)
        console.log(e.object)
        if(e.object.inside == 'a'){
            console.log('BAD STUFF HERE')
            console.trace()
        }
    }
})*/
expression.id = "top"
expression.render = expr.render
expression.symbol = expr.symbol
expression.readaloud = expr.readaloud
expression.parent = undefined
expression.data['inside'] = ''
getById["top"] = expression

const keyCallback = 'onkeydown'

let inputFields = {}
let inputFieldCtr = 0

function renderInput(text, field, name, objID, idx=undefined){
    newInputField = createInput()
    inputFields[inputFieldCtr] = newInputField
    inputFieldCtr++

    waitForElm(`${objID}.${field}`).then(e => getField(e).setCaret(0, 0))
    
    return newInputField.html(inputFieldCtr - 1, text, field, name, objID, idx)
}

function spacer(type, parent, symbol, readaloud){
    // aria-label="before ${parent.name}" role="presentation"
    return `<span type="spacer" role="presentation" custom-label="${readaloud}" class="separator divider" tabindex=-1 myId="${parent.id}" id="${parent.id}.${type}" field="${type}" ${keyCallback}="handleKeyDown(event, this)" onfocus="amSelecting(this)">${symbol}</span>`
}

function makeSymbolSpan(symbol, parent, idx, readaloud){
    if(!symbol || symbol == ''){
        return ``
    }
    // role="presentation"
    return `<span type="symbol" tabindex="-1" aria-hidden="true" role="presentation" custom-label="${readaloud}" class="separator" myId="${parent.id}" id="${parent.id}.separator${idx}" field="separator${idx}" ${keyCallback}="handleKeyDown(event, this)" onfocus="amSelecting(this)">${symbol}</span>`
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

/** focusIdx increments every time we focus on a new element */
let selected = undefined
let focusIdx = 0

function amSelecting(input){
    let focusOn = input.getAttribute('focusOn')
    focusIdx += 1

    // console.log(input.tagName, input)
    if(input.tagName == 'SPAN'){
        announceMessage(input.getAttribute('custom-label'))
    }

    if(focusOn){
        let fieldNum = input.getAttribute('fieldNum')
        inputFields[fieldNum].setCaret(focusOn, focusOn)
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

async function handleAutomaticInsertion(elem, lastToken){
    //console.log('last token:', lastToken)
    if(lookup.hasOwnProperty(lastToken) && !ignoreNonLiteral.hasOwnProperty(lastToken)){
        // remove token
        if(elem.getAttribute('type') == 'input'){
            let val = getField(elem).getValue()
            let updatedString = val.substring(0, val.length - lastToken.length)
            getField(elem).setText(updatedString)
        }
        
        //var event = new Event('input', { bubbles: true });
        //input.dispatchEvent(event);
        //console.log(input)

        // add element
        let newElem = await autocompleteChanged(lastToken, true)

        // focus on new element
        // we shift the caret right, because typing is always left to right (on English keyboards)
        //console.log('shift caret twice')
        /*if(elem.getAttribute('type') == 'input'){
            await shiftCaret(2)
        }else{
            // assert: elem.tagName == 'SPAN'
            //await shiftCaret(0)
        }*/
        
        announceMessage(newElem.name)

        readPos()
        //console.log('done shifting')
        return true
    }
    return false
}

async function handleValueChanged(input, inputValue){
    let fieldName = input.getAttribute("field")
    let id = input.getAttribute("myID")

    //console.log('type of thing:', typeof getById[id].data[fieldName], getById[id].data[fieldName])

    getById[id].data[fieldName] = inputValue
    input.style.minWidth = (inputValue.length) + 'ch';

    ////////// AUTOMATICALLY INSERT ELEMENT, BUT ONLY DO THIS WHEN NOT IN LITERAL MODE //////////
    // hack because onkeydown will trigger in span, and then trigger again input after focusing
    if(!isLiteralMode){
        let str = inputValue
        let tokens = tokenizeWithSymbols(str)
    
        let lastToken = tokens[tokens.length - 1]

        //console.log('input automatic inserting:', lastToken)
        handleAutomaticInsertion(input, lastToken)
    }
    /////////////////////////////////

    updateMemoi(getById[id])
}

async function addToList(id){
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

    await focusOnFind(id + "." + '...' + '.' + (getById[id].data['...'].length - 1) + ".inside")
}

function rerender(item_changed){
    updateMemoi(item_changed)

    let id = document.getElementById(item_changed.id)

    // this was causing bugs-- make sure it's not a problem in the future!
    if(id)
        id.outerHTML = renderDiv(item_changed)
}

async function reroot(node, parent, value, after){
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
            await focusOnFind(newItem.id + "." + newItem.focus)
        else{
            await focusOnFind(newItem.id + "." + newItem.focus2)
        }
    }else{
        await focusOnFind(newItem.id + "." + toFocusOn)
    }

    return newItem
}

async function autocompleteChanged(value, focus2=false) {
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
        console.log('outer div path')
        // this is an outer div
        //if this is 
        let node = getById[id]
        let parent = node.parent

        //console.log('add to this node:')
        //console.log(node)

        return reroot(node, parent, value, false)
    }else if(selected.tagName == 'SPAN'){
        if(field == 'next'){
            let node = getById[id]
            let parent = node.parent

            return reroot(node, parent, value, false)
        }else{
            let node = getById[id]
            let parent = node.parent

            return reroot(node, parent, value, true)
        }
    }else{
        //debugger;
        //console.log('append/add in here')
        //console.log('parent:', getById[id].data)
        //console.log('equals:', getById[id] == expression.data['inside'])
        newItem = create_new(lookup[value], getById[id], field)
        newItem.data[newItem.focus] = getField(selected).getValue()

        //console.log(getById[id].data['inside'])
        getById[id].data[field] = newItem
        //console.log(getById[id].data['inside'])
        
        //getById[id].data[field] = newItem
        //getById[id + '.' + field] = newItem
    }

    //console.log("expression before rerender:", expression.data['inside'])

    rerender(newItem)
    //updateID(newItem.parent)

    //console.log("Expressoin after rerender:", expression.data['inside'])

    if(!focus2)
        await focusOnFind(newItem.id + "." + newItem.focus, selected.selectionStart)
    else
        await focusOnFind(newItem.id + "." + newItem.focus2, selected.selectionStart)

    //console.log("expression after focus:", expression.data['inside'])

    /*console.log('rerender adding new item')
    console.log('selection is: ' + value)
    console.log('item is: ')
    console.log(newItem)*/
    //document.getElementById().focus()

    return newItem
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

async function focusElem(elem){
    let currentFocusIdx = focusIdx
    elem.focus()

    /*while(focusIdx == currentFocusIdx){
        await asyncTimeout(5)
    }*/
}

async function focusOnFind(id, selectionStart=0){
    //console.log("expression before wait for elem:", expression.data['inside'])
    let elem = await waitForElm(id)
    //console.log("expression before setting focusOn:", expression.data['inside'])

    elem.setAttribute('focusOn', selectionStart)
    elem.focus()
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

function play(thing){
    thing.currentTime = 0
    thing.play()
}

function switchTone(){
    play(tone)
}

function beforeTone(field){
    playOpenParen(calculateRelativePos(field).avg.x)
    if(settings.verbosity == 'high'){
        announceMessage('L paren')
    }
}

function afterTone(field){
    playCloseParen(calculateRelativePos(field).avg.x)
    if(settings.verbosity == 'high'){
        announceMessage('R paren')
    }
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
function shiftCaret(delta, announce=true, offset=0){
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
                /*document.getElementById('top.inside.prev').focus()
                beforeTone()*/
                return 0
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

    //console.log('next thing', nextField, nextNode.data[nextField])
    // also handle HCI components like playing tones and whatnot
    if(nextField == 'next' || nextField == 'prev' || nextField.includes('separator') || (typeof nextNode.data[nextField] == 'string')){
        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)
        
        if(typeof nextNode.data[nextField] == 'string'){
            let value = getField(associatedInput).getValue()
            if(delta > 0){
                /*if(announce && value[0 + offset])
                    announceMessage(value[0 + offset])
                console.log('focus on this:', 0 + offset)*/
                associatedInput.setAttribute('focusOn', 0 + offset)
            }else{
                //console.log(nextNode, nextNode.id, nextField)
                //console.log(associatedInput)
                if(value){
                    if(settings.navStyle == 'linear'){
                        /*if(announce && value.length >= 1)
                            announceMessage(value[value.length - 1 + offset])*/
                        associatedInput.setAttribute('focusOn', Math.max(0, value.length - 1 + offset))
                    }else{
                        associatedInput.setAttribute('focusOn', Math.max(0, value.length + offset))
                    }
                }
            }
        }

        focusElem(associatedInput)

        if(announce){
            if(nextField == 'next'){
                afterTone(associatedInput)
            }else if(nextField == 'prev'){
                beforeTone(associatedInput)
            }else if(!nextField.includes('separator')){
                switchTone()
            }
        }

        return Math.sign(delta)
    }
    
    // otherwise, move down until we get to our next selectable-- 
    // either 'next' or 'prev'
    if(delta < 0){
        console.log(nextNode)

        nextNode = nextNode.data[nextField]
        nextField = 'next'

        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)

        focusElem(associatedInput)

        if(announce)
            afterTone(associatedInput)
    }else{
        nextNode = nextNode.data[nextField]
        nextField = 'prev'

        let associatedInput = document.getElementById(nextNode.id + '.' + nextField)

        focusElem(associatedInput)

        if(announce)
            beforeTone(associatedInput)
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
    //console.log("ID:", startingNode.id + '.' + ourSlot)
    newElement.setAttribute('focusOn', cursorPos)

    //updateMemoi(startingNode)

    focusElem(newElement)
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

async function handleKeyDown(event, input) {
    const cursorPosition = getField(input) ? getField(input).getCaretend() : undefined
    //console.log('cursor pos', cursorPosition)

    //console.log('this is the event:', event)
    //console.log('is repeating:', event.repeat)
    //console.log('this is the elem', input)
    if(input.tagName == 'SPAN' && !isNavigation(event)){
        let succ = false
        if(input.getAttribute("type") == 'spacer')
            succ = await handleAutomaticInsertion(input, event.key)
        else if(settings.navStyle == 'linear'){
            console.log('assert eq:', input.getAttribute("type"), 'symbol')
            shiftCaret(-1, announce=false, offset=1)
            // we will automatically handle insertion just by moving offset,
            // so no need to run the line below (actually it glitches and deletes)
            // the last char

            //succ = await handleAutomaticInsertion(selected, event.key)
        }
        
        if(succ){
            event.stopImmediatePropagation()
            event.preventDefault()
        }

        //console.log('inserting elem')
        //console.log(event)
        //console.log('key', event.key)
    } 

    if(event.altKey && event.key == 'Insert'){
        //narrate this element
        announceMessage(input.getAttribute('description') + ' ' + getField(input).getValue())
    }

    if(event.ctrlKey && event.altKey && event.key == 'Insert'){
        //narrate this element
        //console.log(input)
        announceMessage(getField(input).getValue())
    }

    /**
     * Up and down-- move from one node to the next
     */
    if(event.key == 'ArrowUp'){
        let delta = shiftCaret(-1)

        if(delta == 0){
            focusElem(document.getElementById('top.inside'))
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

        //console.log('arrowleft', cursorPosition)
        if(input.getAttribute('type') != 'input' || input.tagName == 'SPAN' || cursorPosition <= 0){
            let delta = shiftCaret(-1)

            event.preventDefault()
            event.stopImmediatePropagation()
        }

        event.stopPropagation();
    } else if (event.key === 'ArrowRight') {
        // Cursor is at the end of the input, prevent moving right
        //event.preventDefault();
        if(settings.navStyle == 'linear'){
            if(input.getAttribute('type') != 'input' || input.tagName == 'SPAN' || cursorPosition >= getField(input).getValue().length - 1){
                // extra shift if we're at the very end of an input field
                // aka already right before the operator
                if(getField(input) && cursorPosition >= getField(input).length){
                    shiftCaret(2)
                }else{
                    shiftCaret(1)
                }
                event.preventDefault()
            }
        }else{
            if(input.getAttribute('type') != 'input' || input.tagName == 'SPAN' || cursorPosition >= getField(input).getValue().length){
                shiftCaret(1)
                event.preventDefault()
            }
        }
        event.stopPropagation();
    }

    //console.log('getting to test if try to delete')
    //console.log(event.key, input.tagName, input.selectionEnd)
    if(event.key == 'Backspace' && (input.tagName == 'SPAN' || getField(input).getCaretend() == 0)){
        console.log('try to delete')
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
    }else if(event.key == 'Delete' && (input.tagName == 'SPAN' || getField(input).getCaret() == getField(input).getValue().length)){
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

////// READ CURRENT POS, AND PROVIDE VERBAL CONTEXT
function readPos(){

}