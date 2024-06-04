let multiselect = {
    selectedNode: undefined,
    selectDelta: 0,
    selectHistory: [],
    lastDelta: 0
}

function triggerSelectOver(field, delta){
    //console.log(delta, field)
    //console.log(getById[field.getAttribute("myId")])
    multiselect.selectedNode = getById[field.getAttribute("myId")]
    multiselect.selectHistory.push(multiselect.selectedNode)
    multiselect.selectDelta = delta
    multiselect.lastDelta = delta
    showSelect()
}

function selectAll(){
    multiselect.selectedNode = expression.data['inside']
    multiselect.selectHistory.push(expression)
    showSelect()
}

/** Returns true if we should short circuit the input field input */
function handleSelect(event, field){
    if(!multiselect.selectedNode){
        //unshowSelect(expression)
        return false
    }

    if(!event.shiftKey){
        if(multiselect.selectedNode){
            unshowSelect()
        }
        multiselect.selectedNode = undefined
        multiselect.selectHistory = []
        multiselect.selectDelta = 0
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

        if(Math.sign(multiselect.selectDelta) == Math.sign(deltadelta)){
            // preserve expression as top level root
            if(multiselect.selectedNode.parent && multiselect.selectedNode.parent != expression){
                multiselect.selectedNode = multiselect.selectedNode.parent
                multiselect.selectHistory.push(multiselect.selectedNode)
            }
        }else{
            //console.log('unhighlight', selectedNode, selectHistory)
            unhighlight(multiselect.selectedNode)
            // extra pop
            if(multiselect.lastDelta != deltadelta){
                multiselect.selectHistory.pop()
            }
            multiselect.selectedNode = multiselect.selectHistory.pop()
            //console.log('new selected node', selectedNode, selectHistory)
        }

        multiselect.lastDelta = deltadelta
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
    highlightGreen(multiselect.selectedNode, false)
}

function showSelect(){
    highlightGreen(multiselect.selectedNode, true)
}