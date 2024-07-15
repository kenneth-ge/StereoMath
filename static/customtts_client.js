async function playAudio(text){
    x = await fetch('gettts?' + new URLSearchParams({
        text
        }).toString())

    var player = new PCMPlayer({
        encoding: '16bitInt',
        channels: 1,
        sampleRate: 22050
    });

    player.feed(new Int16Array(await x.arrayBuffer()))
}