function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.getElementById(selector)) {
            return resolve(document.getElementById(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.getElementById(selector)) {
                observer.disconnect();
                resolve(document.getElementById(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function waitForElmCriteria(selector, criteria) {
    return new Promise(resolve => {
        if (document.getElementById(selector) && criteria(document.getElementById(selector))) {
            return resolve(document.getElementById(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.getElementById(selector) && criteria(document.getElementById(selector))) {
                observer.disconnect();
                resolve(document.getElementById(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function findInMatrix(matrix, target) {
    for(var r = 0; r < matrix.length; r++){
        for(var c = 0; c < matrix[r].length; c++){
            if(matrix[r][c] == target){
                return {r, c}
            }
        }
    }

    return null;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function distance(rect, p) {
    var dx = Math.max(rect.min.x - p.x, 0, p.x - rect.max.x);
    var dy = Math.max(rect.min.y - p.y, 0, p.y - rect.max.y);
    return Math.sqrt(dx*dx + dy*dy);
  }

function inputsToRects(inputs){
    // Assume you have an array of input elements (inputs)
    const inputRectangles = [];

    for (const input of inputs) {
        //console.log('this is the input:', input)
        const inputRect = input.getBoundingClientRect();
        const minX = inputRect.left;
        const minY = inputRect.top;
        const maxX = inputRect.right;
        const maxY = inputRect.bottom;

        // Store the bounding box coordinates
        inputRectangles.push({ min: {x: minX, y: minY}, max: {x: maxX, y: maxY}, avg: {x : (minX + maxX) / 2, y : (minY + maxY) / 2} });
    }

    return inputRectangles
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

let notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

function shiftTone(note, shift){
    //console.log(note, shift)

    let c = notes.indexOf(note[0])
    let octave = note.charCodeAt(1) - '0'.charCodeAt(0)

    c += shift
    
    while(c < 0){
        c += 7
        octave -= 1
    }

    while(c >= 7){
        c -= 7
        octave += 1
    }
    c %= 7

    //console.log('final c', c)

    return notes[c] + '' + octave
}

function getNumBefore(node, field){
    //console.log('------------')
    //console.log(node, field)

    let idx = node.fields.indexOf(field)
    if(!field){
        idx = node.fields.length
    }

    let total = 0

    //console.log('field', field, 'idx')

    // go down
    for(var i = 0; i < idx; i++){
        let thisField = node.fields[i]
        if((!node.data[thisField]) || typeof node.data[thisField] == 'string'){
            //console.log('this is a string')
            total += 1
        }else{
            let val = getNumBefore(node.data[thisField])
            //console.log('child', val, node.data[thisField])
            total += val
        }
    }

    // go up
    if(node.parent && field){
        //console.log('go up')
        let ans = getNumBefore(node.parent, node.slot)
        //console.log('go up and get this ans:', ans, 'from', node, field)
        total += ans
    }

    return total
}

function tokenizeWithSymbols(input) {
    // Construct regular expression pattern to split the input string
    const regexPattern = /(\s+)|([^\w\s])/g;
    
    // Split the input string using the regular expression pattern
    const tokens = input.split(regexPattern);
    
    // Filter out empty strings from the resulting array
    return tokens.filter(token => token !== '' && token && !(/^\s*$/.test(token)));
}

function tokenizeWithSymbolsAndSpaces(input) {
    // Construct regular expression pattern to split the input string
    const regexPattern = /(\s+)|([^\w\s])/g;
    
    // Split the input string using the regular expression pattern
    const tokens = input.split(regexPattern);
    
    // Filter out empty strings from the resulting array
    return tokens.filter(token => token !== '' && token);
}

function asyncTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function observable(v){
    this.value = v;

    this.valueChangedCallback = null;

    this.setValue = function(v){
        if(this.value != v){
            this.value = v;
            this.raiseChangedEvent(v);
        }
    };

    this.getValue = function(){
        return this.value;
    };

    this.onChange = function(callback){
        this.valueChangedCallback = callback;
    };

    this.raiseChangedEvent = function(v){
        if(this.valueChangedCallback){
             this.valueChangedCallback(v);
        }   
    };
}

function calculateRelativePos(input){
    input = inputsToRects([input])[0]

    const {left, top, right, bottom} = document.getElementById('top.inside').getBoundingClientRect()
    const totalsize = {
        x: right - left,
        y: bottom - top
    }

    return {
        min: {
            x: (input.min.x - left) / totalsize.x,
            y: (input.min.y - top) / totalsize.y,
        },
        max: {
            x: (input.max.x - left) / totalsize.x,
            y: (input.max.y - top) / totalsize.y,
        },
        avg: {
            x: (input.min.x + input.max.x - 2 * left) / (2 * totalsize.x),
            y: (input.min.y + input.max.y - 2 * top) / (2 * totalsize.y),
        }
    }
}

function linesIntersect(min1, max1, min2, max2){
    return !((max1 < min2) || (max2 < min1))
}

function normalize(x, y){
    return {left: x / Math.max(x, y), right: y / Math.max(x, y)}
}

function sqr(x){
    return x * x
}

function announceMessageSpatial(message, relPos){
    announceMessage(message, relPos.avg.x, (relPos.avg.y - 0.5) * -15)
}

function announceMessage(message, pos = 0.5, pitchShift=0) {
    if(!message)
        return
    
    if(!pos || typeof pos !== 'number'){
        pos = 0.5
    }

    // add message to log
    var log = document.getElementById('announcementLog')
    log.innerHTML = message + '<br>' + log.innerHTML
    
    console.log('Message played:', message)
    console.log('use remote tts:', settings.useRemoteTTS)

    if(settings.useRemoteTTS == 'true'){
        let {left, right} = normalize(1 - pos, pos)
        playAudio(message, left, right, pitchShift)
    }else{
        // using built-in screen reader
        var alertDiv = document.getElementById('screenReaderAlert');
        alertDiv.textContent = message;

        setTimeout(() => {alertDiv.textContent = ""}, 50)
    }
}

function putInBuffer(text){
    //document.getElementById("bufferTxt").value = text
    //document.getElementById("buffer").style.display = 'flex'

    const newTab = window.open('', '_blank')
    newTab.document.writeln(text)
}

function closeBuffer(){
    //document.getElementById("buffer").style.display = 'none'
}

/* Function to announce message if simulating remote TTS */
function sayIfSim(string){
    if(settings['useRemoteTTS'] == 'true'){
        announceMessage(string)
    }else{
        console.log("Don't say because not sim")
    }
}