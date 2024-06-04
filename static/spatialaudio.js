let before = document.getElementById('before')
let after = document.getElementById('after')
let endClick = document.getElementById('endClick')

function createSpatialObject(audioElem){
    const audioContext = new AudioContext()

    const elem1 = document.createElement('audio')
    const elem2 = document.createElement('audio')
    
    elem1.src = audioElem.src
    elem1.controls = audioElem.controls

    elem2.src = audioElem.src
    elem2.controls = audioElem.controls

    const source1 = audioContext.createMediaElementSource(elem1)
    const source2 = audioContext.createMediaElementSource(elem2)
    
    const merger = audioContext.createChannelMerger(2)
    
    const gainNode1 = audioContext.createGain()
    const gainNode2 = audioContext.createGain()
    
    source1.connect(gainNode1)
    source2.connect(gainNode2)
    
    gainNode1.connect(merger, 0, 0)
    gainNode2.connect(merger, 0, 1)
    
    merger.connect(audioContext.destination)
    
    gainNode1.gain.value = 1
    gainNode2.gain.value = 1
    
    return {
        playSpatial: (left, right) => {
            //console.log('left', left, 'right', right)
            elem1.currentTime = 0
            elem2.currentTime = 0
        
            gainNode1.gain.value = left
            gainNode2.gain.value = right
            
            // this small bit of latency probably matters
            // for spatial audio since we use temporal
            // cues
            if(left >= right){
                elem1.play()
                elem2.play()
            }else{
                elem2.play()
                elem1.play()
            }
        }
    }
}

openObj = createSpatialObject(before)
closeObj = createSpatialObject(after)
endClickObj = createSpatialObject(endClick)

function playOpenParen(pos=0.5){
    //console.log('pos', pos)
    openObj.playSpatial(1 - pos, pos)
}

function playCloseParen(pos=0.5){
    //console.log('pos', pos)
    closeObj.playSpatial(1 - pos, pos)
}

function playEndClick(pos=0.5){
    //console.log('pos', pos)
    endClickObj.playSpatial(1 - pos, pos)
    endClick.load()
    endClick.currentTime = 0
    endClick.play()
}
