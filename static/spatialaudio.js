let before = document.getElementById('before')
let after = document.getElementById('after')

function createSpatialObject(audioElem){
    const audioContext = new AudioContext()

    const source1 = audioContext.createMediaElementSource(audioElem)
    const source2 = audioContext.createMediaElementSource(audioElem)
    
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
            audioElem.currentTime = 0
        
            gainNode1.gain.value = left
            gainNode2.gain.value = right
            
            audioElem.play()
        }
    }
}

openObj = createSpatialObject(before)
closeObj = createSpatialObject(after)

function playOpenParen(pos=0.5){
    //console.log('pos', pos)
    openObj.playSpatial(1 - pos, pos)
}

function playCloseParen(pos=0.5){
    //console.log('pos', pos)
    closeObj.playSpatial(1 - pos, pos)
}
