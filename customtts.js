const { spawn } = require('child_process');
const fs = require('fs');

// Function to execute your binary program and capture audio output
function synthesize(text) {
    return new Promise((resolve, reject) => {
        const audioProcess = spawn('D:\\research\\editor\\piper\\piper.exe', 
            ['--model D:\\research\\editor/piper/en_US-hfc_male-medium.onnx', '--output-raw', '--config D:\\research\\editor/piper/en_US-hfc_male-medium.json'],
            {stdio: "pipe", shell: true});
        
        audioProcess.stdin
        audioProcess.stdin.setEncoding('ascii');
        audioProcess.stdin.write(text);
        audioProcess.stdin.end();

        audioProcess.stderr.pipe(process.stderr)

        //audioProcess.stdout.pipe(process.stdout)

        let audioBuffer = Buffer.alloc(0);

        // Capture stdout data (assuming it's raw audio)
        audioProcess.stdout.on('data', (data) => {
            audioBuffer = Buffer.concat([audioBuffer, data]);
        });

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
            reject(`Error executing process: ${err}`);
        });
    });
}

module.exports = {
    synthesize
}