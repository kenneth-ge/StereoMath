let selectedNode = undefined
let selectDelta = 0
let selectHistory = []
let lastDelta = 0

function triggerSelectOver(field, delta){
    //console.log(delta, field)
    //console.log(getById[field.getAttribute("myId")])
    selectedNode = getById[field.getAttribute("myId")]
    selectHistory.push(selectedNode)
    selectDelta = delta
    lastDelta = delta
    showSelect()
}

/** Returns true if we should short circuit the input field input */
function handleSelect(event, field){
    if(!selectedNode)
        return false

    if(!event.shiftKey){
        if(selectedNode){
            unshowSelect()
        }
        selectedNode = undefined
        selectHistory = []
        selectDelta = 0
        return false
    }

    // we're selecting and stuff
    //console.log('we are selecting', selectedNode)
    if(event.key == 'ArrowLeft' || event.key == 'ArrowRight'){
        let deltadelta = 0
        if(event.key == 'ArrowLeft'){
            deltadelta = -1
        }else{
            deltadelta = 1
        }

        if(Math.sign(selectDelta) == Math.sign(deltadelta)){
            // preserve expression as top level root
            if(selectedNode.parent && selectedNode.parent != expression){
                selectedNode = selectedNode.parent
                selectHistory.push(selectedNode)
            }
        }else{
            //console.log('unhighlight', selectedNode, selectHistory)
            unhighlight(selectedNode)
            // extra pop
            if(lastDelta != deltadelta){
                selectHistory.pop()
            }
            selectedNode = selectHistory.pop()
            //console.log('new selected node', selectedNode, selectHistory)
        }

        lastDelta = deltadelta
    }

    //console.log(selectedNode)

    showSelect()

    return true
}

function highlight(node){
    document.getElementById(node.id).style.backgroundColor = 'chartreuse'
}

function unhighlight(node){
    document.getElementById(node.id).style.backgroundColor = ''
}

function highlightGreen(node, onoff=true) {
    if(onoff)
        highlight(node)
    else
        unhighlight(node)

    for(var field of node.fields){
        if(node.data[field] && typeof node.data[field] != 'string'){
            // another node
            highlightGreen(node.data[field], onoff)
        }
    }
}

function unshowSelect(){
    highlightGreen(selectedNode, false)
}

function showSelect(){
    highlightGreen(selectedNode, true)
}