function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.getElementById(selector)) {
            return resolve(document.getElementById(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.getElementById(selector)) {
                observer.disconnect();
                resolve(document.getElementById(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function findInMatrix(matrix, target) {
    for(var r = 0; r < matrix.length; r++){
        for(var c = 0; c < matrix[r].length; c++){
            if(matrix[r][c] == target){
                return {r, c}
            }
        }
    }

    return null;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function distance(rect, p) {
    var dx = Math.max(rect.min.x - p.x, 0, p.x - rect.max.x);
    var dy = Math.max(rect.min.y - p.y, 0, p.y - rect.max.y);
    return Math.sqrt(dx*dx + dy*dy);
  }

function inputsToRects(inputs){
    // Assume you have an array of input elements (inputs)
    const inputRectangles = [];

    for (const input of inputs) {
    const inputRect = input.getBoundingClientRect();
    const minX = inputRect.left;
    const minY = inputRect.top;
    const maxX = inputRect.right;
    const maxY = inputRect.bottom;

    // Store the bounding box coordinates
    inputRectangles.push({ min: {x: minX, y: minY}, max: {x: maxX, y: maxY} });
    }

    return inputRectangles
}