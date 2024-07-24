const { spawn } = require('child_process');
const fs = require('fs');

const audioProcess = spawn('../piper/piper', 
    ['--model ../piper/en_US-hfc_male-medium.onnx', '--output-raw', '--config ../piper/en_US-hfc_male-medium.json'],
    {stdio: "pipe", shell: true});

audioProcess.stdin
audioProcess.stdin.setEncoding('ascii');

audioProcess.stderr.pipe(process.stderr)

// Function to execute your binary program and capture audio output
function synthesize(text) {
    return new Promise((resolve, reject) => {
        //audioProcess.stdout.pipe(process.stdout)

        let audioBuffer = Buffer.alloc(0);

        let dataListener = (data) => {
            audioBuffer = Buffer.concat([audioBuffer, data]);
        }

        let stopListener = (data) => {
            let dataString = data.toString()
            console.log('stderr data:', dataString)
            if(audioBuffer.length > 0 && (dataString.includes("Real-time factor") || dataString.includes("Waiting for audio"))){
                audioProcess.stderr.off('data', stopListener)
                audioProcess.stdout.off('data', dataListener)
                console.log('audio buffer:', audioBuffer.length)
                console.log('sending')
                resolve(audioBuffer); // Resolve with captured audio data
            }else{
                //reject(`Piper error: ${dataString}`);
            }
        }

        // Capture stdout data (assuming it's raw audio)
        audioProcess.stdout.on('data', dataListener);

        audioProcess.stderr.on('data', stopListener)

        audioProcess.stdin.write(text);
        audioProcess.stdin.write('\n');

        // Handle process exit
        audioProcess.on('exit', (code, signal) => {
            console.log('audio buffer:', audioBuffer.length)
            if (code === 0) {
                resolve(audioBuffer); // Resolve with captured audio data
            } else {
                reject(`Process exited with code ${code} and signal ${signal}`);
            }
        });

        // Handle errors
        audioProcess.on('error', (err) => {
            console.error(`Error executing process: ${err}`)
            reject(`Error executing process: ${err}`);
        });
    });
}

module.exports = {
    synthesize
}