const { spawn } = require('child_process');
const fs = require('fs');

const audioProcess = spawn('../piper/piper', 
    ['--model ../piper/en_US-hfc_male-medium.onnx', '--output-raw', '--config ../piper/en_US-hfc_male-medium.json'],
    {stdio: "pipe", shell: true});

audioProcess.stdin
audioProcess.stdin.setEncoding('ascii');

audioProcess.stderr.pipe(process.stderr)

const { Mutex } = require('async-mutex');

const mutex = new Mutex();

let counter = 0
let currFinished = 0

let resMap = new Map()

let audioBuffer = Buffer.alloc(0);

let dataListener = async (data) => {
    //let release = await mutex.acquire()
    audioBuffer = Buffer.concat([audioBuffer, data]);
    //release()
}

function until(conditionFunction) {
    const poll = resolve => {
        if(conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 400);
    }

    return new Promise(poll);
}

let stopListener = async (data) => {
    let release = await mutex.acquire()
    let dataString = data.toString()
    console.log('stderr data:', dataString)
    if(dataString.includes("Real-time factor"/* || dataString.includes("Waiting for audio")*/)){
        await until(() => audioBuffer.length > 0)
        console.log('audio buffer:', audioBuffer.length)
        console.log('sending')
        resMap.get(currFinished).send(Buffer.from(audioBuffer, 'binary'))
        resMap.delete(currFinished)
        audioBuffer = Buffer.alloc(0);
        currFinished++
    }else{
        console.error(`Piper error: ${dataString}`)
        //reject(`Piper error: ${dataString}`);
    }
    release()
}

// Capture stdout data (assuming it's raw audio)
audioProcess.stdout.on('data', dataListener);

audioProcess.stderr.on('data', stopListener)

// Handle process exit
audioProcess.on('exit', (code, signal) => {
    console.log('unused audio buffer:', audioBuffer.length)
});

// Handle errors
audioProcess.on('error', (err) => {
    console.error(`Error executing process: ${err}`)
    reject(`Error executing process: ${err}`);
});


// Function to execute your binary program and capture audio output
async function synthesize(text, res) {
    let release = await mutex.acquire()
    let thisCount = counter
    resMap.set(thisCount, res)
    counter++

    console.log('Send to Piper:', text)

    audioProcess.stdin.write(text);
    audioProcess.stdin.write('\n');
    release()
}

module.exports = {
    synthesize
}