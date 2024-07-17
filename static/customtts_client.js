let player = new PCMPlayer({
    encoding: '16bitInt',
    channels: 1,
    sampleRate: 22050
});

async function playAudio(text, left=1, right=1){
    x = await fetch('gettts?' + new URLSearchParams({
        text
        }).toString())

    let data = new Int16Array(await x.arrayBuffer())
    player.volume(left, right)

    player.feed(data)
}