let player = new PCMPlayer({
    encoding: '16bitInt',
    channels: 1,
    sampleRate: 22050
});

let saved = new Map()

async function playAudio(text, left=1, right=1, pitchShift=0){
    //console.log(saved)
    let data = undefined
    if(saved.has(text)){
        data = saved.get(text)
    }else{
        x = await fetch('gettts?' + new URLSearchParams({
            text
            }).toString())
    
        data = new Int16Array(await x.arrayBuffer())
        
        saved.set(text, data)
    }

    player.volume(left, right)

    player.feed(new Int16Array(data), pitchShift)
}

function resetTTS(){
    fetch('/reset_tts')
    saved.clear()
}