function tokenize(str) {
    const symbols = [' ', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', ']', '{', '}', ';', ':', '\'', '\"', ',', '.', '<', '>', '/', '?', '|'];

    let tokens = []
    let curr_token = ''

    for(var c of str){
        if(symbols.includes(c)){
            if(curr_token.length > 0){
                tokens.push(curr_token)
                curr_token = ''
            }
            if(c != ' '){
                tokens.push(c)
            }
        }else if(c == '\\'){
            if(curr_token.length > 0){
                tokens.push(curr_token)
                curr_token = ''
            }
            curr_token += c
        }else{
            curr_token += c
        }
    }

    if(curr_token.length > 0){
        tokens.push(curr_token)
        curr_token = ''
    }

    return tokens
}

function tfidf(documents) {
    const tf = (word, document) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = document.match(new RegExp(escapedWord, 'g'));
      return matches ? matches.length / document.length : 0;
    };
  
    const idf = (word, documents) => {
      const numDocumentsWithWord = documents.filter(document => document.includes(word)).length;
      return Math.log(documents.length / numDocumentsWithWord);
    };
  
    const uniqueWords = [...new Set(tokenize(documents.join(' ')))];
  
    return documents.map(document => {
      const words = tokenize(document)
      const scores = words.map(word => tf(word, document) * idf(word, documents));
      return uniqueWords.reduce((obj, word, i) => {
        if(scores[i])
            obj[word] = scores[i];
        else
            obj[word] = 0
        return obj;
      }, {});
    });
  }

  let test_docs =     
    [{"latex": "\\theta_{n}(\\NVar{z}|\\NVar{\\tau})=\\ifrac{\\theta_{4}\\left(u\\middle|\\tau\\right)}{%\\theta_{4}\\left(0\\middle|\\tau\\right)}", "output": "The expression is a definition of a function named \"theta n\" (theta sub n) with two variables as input parameters: \"z\" and \"tau\". The function is defined in terms of a ratio of two other functions, \"theta four\" (theta sub four), with \"u\" and \"tau\" as input parameters. The numerator of the ratio is \"theta four\" evaluated at \"u\" and \"tau\", while the denominator is \"theta four\" evaluated at \"0\" and \"tau\"."},
    {"latex": "\\theta_{s}(\\NVar{z}|\\NVar{\\tau})=\\pi{\\theta_{3}}^{2}\\left(0\\middle|\\tau\\right)%\\ifrac{\\theta_{1}\\left(u\\middle|\\tau\\right)}{\\theta_{1}'\\left(0\\middle|\\tau%\\right)}", "output": "theta s of z, given tau, equals pie third cubed of three at zero, middle tau, crossed with one over the derivative of one of u, given tau, divided by the derivative of one of zero, given tau."},
    {"latex": "\\theta\\genfrac{[}{]}{0.0pt}{}{\\NVar{\\boldsymbol{{\\alpha}}}}{\\NVar{\\boldsymbol{%{\\beta}}}}\\left(\\NVar{\\mathbf{z}}\\middle|\\NVar{\\boldsymbol{{\\Omega}}}\\right)", "output": "theta, followed by an expression in a fraction with numerator and denominator, both represented by the variables NVar{\\boldsymbol{{\\alpha}}} and NVar{\\boldsymbol{{\\beta}}}, respectively. The fraction is contained within parentheses, with the argument inside the parentheses being the variable NVar{\\mathbf{z}} and the argument just outside the parentheses being the variable NVar{\\boldsymbol{{\\Omega}}"},
    {"latex": "x\\in(0,A]", "output": "\"x is in the interval from 0 to A, including 0 but not including A.\""},
    {"latex": "\\lim_{x \\to 0} \\frac{\\sin x}{x}", "output": "the limit as x goes to zero of sin x over x"},
    {"latex": "\\lim_{n \\to \\infty} A_n", "output": "the limit as n goes to infinity of A of n"},
    {"latex": "infinity", "output": "\\infty"}]

const latexes = test_docs.map(obj => obj.latex);
const outputs = test_docs.map(obj => obj.output);


function submitForm() {
    // Get values from the form
    var latexValue = document.getElementById("latex").value;
    var outputValue = document.getElementById("output").value;

    latexValue = answerMathField.latex(); // Get entered math in LaTeX format

    // Create a JSON object
    var jsonData = {
        "latex": latexValue,
        "output": outputValue
    };

    // Send a POST request to localhost:8000/
    fetch('http://localhost:8000/calc_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        // Log the returned JSON output to the console
        console.log(data);
        alert(JSON.stringify(data))
    })
    .catch(error => {
        console.error('Error:', error);
    });
}