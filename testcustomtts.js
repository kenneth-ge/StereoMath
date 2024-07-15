let {synthesize} = require('./customtts')

async function hi(){
    let audioBuffer = await synthesize('hi')

    // Initialize a new AudioContext
    let { AudioContext } = require('web-audio-api')

    console.log(audioBuffer.length)
    console.log(audioBuffer)

    const audioContext = new AudioContext({ sampleRate: 16 })

    // Create a source node
    const source = audioContext.createBufferSource();

    // Decode the audioBuffer
    audioContext.decodeAudioData(audioBuffer, (decodedBuffer) => {
        // Set the decoded buffer as the source node's buffer
        source.buffer = decodedBuffer;

        // Connect the source to the destination (speakers)
        source.connect(audioContext.destination);

        // Start playback
        source.start(0);
    }, (error) => {
        console.error('Error decoding audio data:', error);
    });
}

hi()