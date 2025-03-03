/**
 * Reserved keywords:
 * separator
 */

const NodeDirection = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

let settings = {
    verbosity: 'low',
    navStyle: 'equation',
    playOn: 'anywhere',
    useRemoteTTS: 'true'
}

let possibleSettings = {
    verbosity: ['low', 'high'],
    navStyle: ['linear', 'equation'],
    playOn: ['anywhere', 'field'],
    useRemoteTTS: ['true', 'false']
}

function opensettings(){
    document.getElementById('settings').style.display = 'flex';
    document.getElementById('verbosity').focus()
}

function closesettings(){
    document.getElementById('settings').style.display = 'none';
}

function init(){
    var selectElements = document.getElementById('settings').querySelectorAll('select');

    selectElements.forEach(function (select) {
        select.addEventListener('change', function (event) {
            settings[event.target.name] = event.target.value
            console.log(`${event.target.name} changed to ${event.target.value}`);
            announceMessage(`${event.target.name} changed to ${event.target.value}`)
        });
    });
}

init()