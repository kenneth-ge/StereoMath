let charList = 
[' ', '~', ' ', ' ', 'j', ' ', 'z', 'x', ' ', 'v', 'q', 'u', 'l', 'n', 'm', 'p', 'g', 'f', 'y', 'w', 't', 's', 'r', 'o', 'k', 'i', 'h', 'e', 'c', 'd', 'b', 'a', ' ', '_', ' ', ' ', '\\', 'Z', ' ', 'Y', 'W', 'P', 'U', 'V', 'T', 'Q', 'R', 'X', 'K', 'S', 'N', 'O', 'G', 'L', 'M', 'I', 'J', 'H', 'F', 'E', 'C', 'D', 'B', '?', ';', '@', '=', '>', 'A', '6', '9', ':', '8', '7', '5', '3', '4', '2', '1', '0', '/', '-', '.', '+', ' ', ' ', ' ', ' ', '&', '%', ' ', '$', '#', ' ', '!', ' ', ' ', '^', '*', '(', ')', '[', ']', '{', '}', '|', '<', ',', '"', "'"]
/*
[' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', 
'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 
'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 
'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 
'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 
'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ' ']*/
let charAudioMap = {}

for(var i = 0; i < charList.length; i++){
    var sound      = document.createElement('audio');
    sound.id       = 'audio-player';
    sound.controls = 'controls';
    sound.src      = 'charreads/' +i + '..mp3';
    sound.type     = 'audio/mpeg';

    charAudioMap[charList[i]] = createSpatialObject(sound)
}

function createInput(){
    let caret = 0
    let caretend = 0
    let string = ""
    let valueChanged = () => {console.log('none')}
    let handleKeys = false
    let id = ""
    let fieldId = ""

    function createCharDiv(c){
        let div = document.createElement('div')

        // handle special escape chars
        if(c == ' '){
            c = '&nbsp;'
        }
        div.innerHTML = c
        div.setAttribute('class', 'char')

        return div
    }

    function addCarets(textfield, caretDiv, caretendDiv, isCaret, isCaretEnd){
        let highlight = 0

        if(isCaret && isCaretEnd){
            caretendDiv.style.marginLeft = "-10px";
            caretendDiv.style.backgroundColor = "rgb(192,125,192)";
            caretDiv.style.backgroundColor = "rgb(192,125,192)";
        }else if(isCaret ^ isCaretEnd){
            caretendDiv.style.marginLeft = "0px";
            caretendDiv.style.backgroundColor = "blue";
            caretDiv.style.backgroundColor = "orange";
        }

        if(isCaret){
            textfield.appendChild(caretDiv)
            highlight++
        }
        if(isCaretEnd){
            textfield.appendChild(caretendDiv)
            highlight++
        }

        return highlight
    }

    // update UI accordingly
    function updateUI(updatecaret, updatecaretend){
        let textfield = document.getElementById(id)
        let caretDiv = document.getElementById('caret' + fieldId)
        let caretendDiv = document.getElementById('caretend' + fieldId)

        try {
            textfield.removeChild(caretDiv)
        } catch (error) {
            caretDiv = document.createElement('span')
            caretDiv.setAttribute('class', 'caret')
            caretDiv.setAttribute('id', `caret${fieldId}`)
        }
        try {
            textfield.removeChild(caretendDiv)
        } catch (error) {
            caretendDiv = document.createElement('span')
            caretendDiv.setAttribute('class', 'caret caretend')
            caretendDiv.setAttribute('id', `caretend${fieldId}`)
        }

        textfield.innerHTML = ""

        let counter = 0
        let val = 0
        for(var c of string){
            val += addCarets(textfield, caretDiv, caretendDiv, counter == caret || (counter == 0 && caret < 0), counter == caretend || (counter == 0 && caretend < 0))
            let cdiv = createCharDiv(c)

            if(val % 2 == 1){
                cdiv.setAttribute('class', cdiv.getAttribute('class') + ' highlighted')
            }

            textfield.appendChild(cdiv)
            counter += 1
        }
        addCarets(textfield, caretDiv, caretendDiv, caret == string.length || (caret > string.length), caretend == string.length || (caretend > string.length))
    }

    function getTokenShift(left){
        if(left){
            let tokens = tokenizeWithSymbolsAndSpaces(string.substring(0, caretend))
            //console.log(string, string.substring(0, caretend), tokens)
            let shift = tokens.length > 0 ? tokens[tokens.length - 1].length : 0

            // last token is all whitespace
            if(tokens.length > 1 && /^\s*$/.test(tokens[tokens.length - 1])){
                shift += tokens[tokens.length - 2].length
            }

            return shift
        }else{
            let tokens = tokenizeWithSymbolsAndSpaces(string.substring(caretend, string.length))
            //console.log(string, string.substring(caretend, string.length), tokens)
            let shift = tokens.length > 0 ? tokens[0].length : 0

            // last token is all whitespace
            if(tokens.length > 1 && /^\s*$/.test(tokens[0])){
                shift += tokens[1].length
            }

            return shift
        }
    }

    /** play this char, but in a spatial context */
    function spatialChar(c){
        if(c.length > 1 || !charAudioMap[c]){
            // fallback if we accidentally put a string in here, rather than a char
            announceMessage(c)
            console.error(c, 'should be one single char or missing audio file')
            return;
        }

        let spatialPos = calculateRelativePos(document.getElementById('caretend' + fieldId)).avg.x

        //console.log('playspatial', c, charAudioMap[c], spatialPos)

        charAudioMap[c].playSpatial(1 - spatialPos, spatialPos)
    }

    /** Play sound/readaloud current action (e.g. what character you're highlighting) */
    function playSound(isHighlighting, delta){
        if(isHighlighting){
            let oldSize = Math.abs((caretend - delta) - caret)
            let newSize = Math.abs(caretend - caret)

            // readaloud
            // if selecting, then announce what has just been (un)selected
            let selectedOrNot = newSize < oldSize ? ' unselected' : ' selected'
            if(delta < 0)
                announceMessage((string[caretend] == 'a' ? 'A' : string[caretend]) + selectedOrNot)
            else if(delta > 0)
                announceMessage((string[caretend - 1] == 'a' ? 'A' : string[caretend - 1]) + selectedOrNot)
            else{
                // nothing changed
                // TODO: custom behavior here?
                playEndClick(calculateRelativePos(document.getElementById('caretend' + fieldId)).avg.x)
            }
        }else{
            // read new char
            if(caretend == string.length){
                // play end of text sound
                playEndClick(calculateRelativePos(document.getElementById('caretend' + fieldId)).avg.x)
            }else{
                // if simply moving cursor, then play the new char
                spatialChar(string[caretend])
            }
        }
    }

    async function handleKey(event, field){
        //console.log('stuff', event, field, handleKeys)
        if(await handleKeyDown(event, field)){
            return
        }
        if(handleSelect(event, field))
            return

        if(!handleKeys || spatialNav != 'OFF')
            return

        let left = event.code == 'ArrowLeft'
        let right = event.code == 'ArrowRight'

        // move caret end
        if(left || right){
            let delta = left ? -1 : 1

            // calculate token shift
            if(event.ctrlKey){
                delta *= getTokenShift(left)
            }

            // no shift if we would go over
            if(caretend + delta < 0 || caretend + delta > string.length){
                if(event.shiftKey)
                    triggerSelectOver(field, delta)
                delta = 0
            }

            caretend += delta

            let updatecaret = false
            // handle shift modifier
            if(!event.shiftKey){
                /*if(caret + delta < 0 || caret + delta > string.length){
                    delta = 0
                }
                caret += delta
                caretend = caret*/
                if(Math.abs(caret - caretend) > 2 && !event.ctrlKey){
                    caretend -= delta
                }

                caret = caretend

                updatecaret = true

                playSound(false, delta)
            }else{
                playSound(true, delta)
            }

            updateUI(updatecaret, true)
        }

        // type char
        if(!event.ctrlKey)
        if(event.key.length == 1){
            let start = string.substring(0, Math.min(caret, caretend))
            let end = string.substring(Math.max(caret, caretend), string.length)
            string = start + event.key + end

            // update caret
            caret = Math.min(caret, caretend) + 1
            caretend = caret
            updateUI(true, true)

            spatialChar(event.key)
        }

        // delete char
        if(event.key == 'Backspace' || event.key == 'Delete'){
            let start = undefined
            let end = undefined
            let deleted = undefined
            let offset = 0

            // delete single char
            if(caret == caretend){
                if(event.ctrlKey){
                    let left = event.key == 'Backspace'

                    // delete token if necessary
                    let amtDelete = getTokenShift(left)

                    if(left){
                        start = string.substring(0, caret - amtDelete)
                        end = string.substring(caret, string.length)
                        deleted = string.substring(caret - amtDelete, caret)
                    }else{
                        start = string.substring(0, caret)
                        end = string.substring(caret + amtDelete, string.length)
                        deleted = string.substring(caret, caret + amtDelete)
                    }

                    offset = left ? -amtDelete : 0
                }else{
                    // delete before cursor
                    if(event.key == 'Backspace'){
                        if(caret > 0){
                            start = string.substring(0, caret - 1)
                            end = string.substring(caret, string.length)
                            deleted = string.substring(caret - 1, caret)
                            offset = -1
                        }else{
                            // trying to delete empty
                            // TODO: custom behavior here?
                        }
                    }else{
                        // delete after cursor
                        if(caret < string.length){
                            start = string.substring(0, caret)
                            end = string.substring(caret + 1, string.length)
                            deleted = string.substring(caret, caret + 1)
                            offset = 0
                        }else{
                            // trying to delete empty
                            // TODO: custom behavior here?
                        }
                    }
                }
            }else{
                // delete selection
                start = string.substring(0, Math.min(caret, caretend))
                end = string.substring(Math.max(caret, caretend), string.length)
                deleted = string.substring(Math.min(caret, caretend), Math.max(caret, caretend))
            }

            if(start == undefined || end == undefined){
                return
            }

            string = start + end

            //console.log(caret, caretend, string.length)
            // update caret
            caret = Math.min(caret, caretend) + offset
            caretend = caret
            updateUI(true, true)

            announceMessage(deleted)
        }

        //console.log('value changed')
        valueChanged(string)
        if(!event.ctrlKey && !(event.key=='Tab')){
            //console.log('prevent default')
            event.preventDefault()
        }
    }

    function changeDisplay(type){
        let caretDiv = document.getElementById('caret' + fieldId)
        let caretendDiv = document.getElementById('caretend' + fieldId)

        try {
            caretDiv.style.display = type
        } catch (error) {
        }
        try {
            caretendDiv.style.display = type
        } catch (error) {
            
        }
    }

    function select(div){
        //console.log('select, focusing')
        switchTone()

        amSelecting(div)
        handleKeys = true

        changeDisplay('block')
        playSound(caret != caretend, 0)
    }

    function blur(){
        //console.log('blurring')
        handleKeys = false

        changeDisplay('none')
    }

    function html(fieldNum, text, field, name, objID, idx){
        //return `<input aria-label="${field} of ${name}" role="application" style="min-width: ${text.length}ch" autocomplete="off" description="${field} of ${name}" tabindex="0" type="text" class="placeholder" id="${objID}.${field}" myId="${objID}" field="${field}" onfocus="amSelecting(this)" oninput="handleValueChanged(this)" value="${text}" idx=${idx} ${keyCallback}="handleKeyDown(event, this)"/>`
        string = text
        valueChanged = () => {
            let div = document.getElementById(`${objID}.${field}`)
            div.setAttribute('value', string)
            handleValueChanged(div, string)
        }
        id = `${objID}.${field}`
        fieldId = fieldNum

        return `<div type="input" value="" aria-label="${field} of ${name}" role="application" style="min-width: ${text.length}ch" autocomplete="off" description="${field} of ${name}" class="placeholder inputfield" id="${objID}.${field}" myId="${objID}" field="${field}" fieldNum="${fieldNum}" onblur="inputFields[${fieldNum}].blur()" onfocus="inputFields[${fieldNum}].select(this)" idx=${idx} onkeydown="inputFields[${fieldNum}].handleKey(event, this)" tabindex="0">
        <span class="caret" id="caret${fieldNum}"></span>
        <span class="caret caretend" id="caretend${fieldNum}"></span>
    </div>`
    }

    function setCaret(start, end){
        caret = parseInt(start)
        caretend = parseInt(end)

        updateUI(true, true)
    }

    function getCaret(){
        return caret
    }

    function getCaretend(){
        return caretend
    }

    function getValue(){
        return string
    }

    function setText(text){
        string = text
        updateUI(true, true)
    }

    return {
        html, select, blur, handleKey, setCaret, getCaretend, getValue, getCaret, setText
    }
}

function getField(input){
    let ret = inputFields[input.getAttribute('fieldNum')]

    /*if(!ret){
        console.log('this is undefined', input)
    }*/

    return ret
}