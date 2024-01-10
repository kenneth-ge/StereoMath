def tokenize(input_str):
    symbols = [' ', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', ']', '{', '}', ';', ':', '\'', '\"', ',', '.', '<', '>', '/', '?', '|']

    tokens = []
    curr_token = ''

    for c in input_str:
        if c in symbols:
            if curr_token:
                tokens.append(curr_token)
                curr_token = ''
            if c != ' ':
                tokens.append(c)
        elif c == '\\':
            if curr_token:
                tokens.append(curr_token)
                curr_token = ''
            curr_token += c
        else:
            curr_token += c

    if curr_token:
        tokens.append(curr_token)

    return tokens


# preprocess everything
import json

# Specify the path to your JSON file
json_file_path = 'combined.json'

# Open and read the JSON file
with open(json_file_path, 'r') as file:
    # Load JSON data from the file
    data = json.load(file)

latex_list = [item["latex"] for item in data]
output_list = [item["output"] for item in data]

from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer

transformer = SentenceTransformer('sentence-transformers/paraphrase-MiniLM-L3-v2')

# Create a TfidfVectorizer instance
latex_vectorizer = TfidfVectorizer(tokenizer=tokenize)
output_vectorizer = TfidfVectorizer()

# Transform the documents into a TF-IDF matrix
latex_matrix = latex_vectorizer.fit_transform(latex_list)
output_matrix = output_vectorizer.fit_transform(output_list)

# Specify the file path
file_path = "new.json"

# Open the file in append mode
file = open(file_path, 'a')

def write_file(output):
    # Write the content to the file
    file.write(json.dumps(output) + '\n')

from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

from datetime import datetime, timedelta

# Function to get the current time
def get_current_time():
    return datetime.now()

last_event_time = get_current_time()

pending_latex = []
pending_outputs = []

@app.route('/')
def index():
    return render_template('index.html')

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def to_score(x):
    return (x * 1000) ** 2

@app.route('/calc_score', methods=['POST'])
def calc_score():
    global pending_latex, pending_outputs, latex_vectorizer, output_vectorizer, latex_matrix, output_matrix

    current_time = get_current_time()

    # Check if at least one hour has elapsed
    elapsed_time = current_time - last_event_time
    if elapsed_time >= timedelta(hours=1):
        print("At least one hour has elapsed since the last event.", flush=True)
        print("Recalculating TFIDF", flush=True)

        latex_list.append(pending_latex)
        output_list.append(pending_outputs)

        latex_matrix = latex_vectorizer.fit_transform(latex_list)
        output_matrix = output_vectorizer.fit_transform(output_list)

        pending_latex = []
        pending_outputs = []

    data = request.get_json()  # Assumes JSON data is sent in the request

    print(f"Received data: {data}", flush=True)

    pending_latex.append(data['latex'])
    pending_outputs.append(data['output'])

    write_file(data)

    query_latex = latex_vectorizer.transform([data['latex']])
    query_output = output_vectorizer.transform([data['output']])

    # take negative to represent dissimilarity
    # dot product is equal to cosine similarity when pre normalized
    # problem with taking distance to average is that floating point rounds down to 0
    """
    lm = np.asarray(latex_matrix.mean(axis=0))
    om = np.asarray(output_matrix.mean(axis=0))
    print(lm.shape, query_latex.shape)
    latex_dissimilarity = -cosine_similarity(lm, query_latex)[0][0]
    output_dissimilarity = -cosine_similarity(om, query_output)[0][0]
    """

    latex_dissimilarity = abs(np.mean(np.dot(latex_matrix, query_latex.T)))
    output_dissimilarity = abs(np.mean(np.dot(output_matrix, query_output.T)))
    
    print("Assert: ", latex_dissimilarity >= -1 and latex_dissimilarity <= 1, flush=True)
    print("Assert: ", output_dissimilarity >= -1 and output_dissimilarity <= 1, flush=True)

    print(latex_dissimilarity, output_dissimilarity)

    # calculate score
    score = to_score(latex_dissimilarity) + to_score(output_dissimilarity) * 2

    # Use jsonify to create a JSON response
    response = jsonify({"score": score})

    # You can set the Content-Type header to application/json if needed
    response.headers['Content-Type'] = 'application/json'

    return response

if __name__ == '__main__':
    app.run(port=8000, debug=True)
