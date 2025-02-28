# StereoMath: An Accessible and Musical Equation Editor (Published ASSETS '24)

Authors: Kenneth Ge (kenneth-ge), Prof. JooYoung Seo

Please read our paper here: [open access paper](https://arxiv.org/abs/2501.01404), [official ACM publication](https://dl.acm.org/doi/10.1145/3663548.3688487)

[![demo video, with audio narration](https://img.youtube.com/vi/hJH8CvrOmMI/0.jpg)](https://www.youtube.com/watch?v=hJH8CvrOmMI)

Licensed under MIT-no-AI license. 

To run, make sure you have Node.js installed. Then, run `node index.js`, and navigate to http://localhost:3000/. Electron build also available with no dependencies in releases. Enjoy!

Key combinations:
* CTRL + \\ to fold/unfold
* CTRL + ALT + \\ to toggle read friendly mode
* SHIFT + ESC to use spatial navigation
* CTRL + SPACE to insert/add new element
* ALT + INSERT to read current item
* CTRL + ALT + L to enter literal character insert mode (so it won't automatically insert elements for you)
* Reading/review (press any of these twice to get it into a new tab buffer):
    * CTRL + ALT + LEFT BRACKET to read aloud the whole expression using MathSpeak
        * ALT + LEFT BRACKET to read the current node in MathSpeak
    * CTRL + ALT + RIGHT BRACKET to read aloud the whole expression using the intuitive built-in readaloud system
        * ALT + RIGHT BRACKET to read the current node in Intuitive Mode

![Early Demo of Editor, Displaying Equation](Screenshot_24-2-2024_22859_localhost.jpeg)
