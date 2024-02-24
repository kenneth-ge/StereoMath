import math
import os
import pickle

import numpy as np


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

def get_command_tokens(input_str):
    return list(filter(lambda x: x.startswith('\\'), tokenize(input_str)))

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

from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

transformer = SentenceTransformer('sentence-transformers/paraphrase-MiniLM-L3-v2')

# Transform the documents
cmd_cache_path = 'cached_command_orderings.pkl'

if os.path.exists(cmd_cache_path):
    with open(cmd_cache_path, "rb") as file:
        command_ordering, cmd_counts = pickle.load(file)
else:
    cmd_counts = {}

    for example in latex_list:
        for token in tokenize(example):
            if token.startswith('\\'):
                if token not in cmd_counts:
                    cmd_counts[token] = 1
                else:
                    cmd_counts[token] += 1

    command_ordering = []

    for key, value in cmd_counts.items():
        command_ordering.append((value, key))

    command_ordering.sort()
    with open(cmd_cache_path, "wb") as file:
        pickle.dump((command_ordering, cmd_counts), file)

ranks = {}

for idx, (cnt, token) in enumerate(command_ordering):
    ranks[token] = idx

cache_path = 'cached_output_embeddings.pkl'

if os.path.exists(cache_path):
    with open(cache_path, "rb") as file:
        output_matrix = pickle.load(file)
        print(output_matrix.shape)
else:
    embeddings = transformer.encode(output_list, convert_to_tensor=True, show_progress_bar=True)
    output_matrix = np.vstack(embeddings.cpu().numpy())
    with open(cache_path, "wb") as file:
        pickle.dump(output_matrix, file)

# Specify the file path
file_path = "new.json"

# Open the file in append mode
file = open(file_path, 'a')

def write_file(output):
    # Write the content to the file
    file.write(json.dumps(output) + '\n')

from flask import Flask, jsonify, render_template, request

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

@app.route('/accessible')
def accessible():
    return render_template('index_accessible.html')

@app.route('/accessible2')
def accessible2():
    return render_template('index_accessible2.html')

from sklearn.metrics.pairwise import cosine_similarity


def to_score(x):
    return (x ** 2) * 100

@app.route('/calc_score', methods=['POST'])
def calc_score():
    global pending_latex, pending_outputs, output_matrix, ranks

    current_time = get_current_time()

    # Check if at least one hour has elapsed
    elapsed_time = current_time - last_event_time
    if elapsed_time >= timedelta(hours=1):
        print("At least one hour has elapsed since the last event.", flush=True)
        print("Recalculating TFIDF", flush=True)

        latex_list.append(pending_latex)
        output_list.append(pending_outputs)

        # add new commands to latex ordering
        for example in pending_latex:
            for token in tokenize(example):
                if token.startswith('\\'):
                    if token not in cmd_counts:
                        cmd_counts[token] = 1
                    else:
                        cmd_counts[token] += 1

        command_ordering = []

        for key, value in cmd_counts.items():
            command_ordering.append((value, key))

        command_ordering.sort()

        with open(cmd_cache_path, "wb") as file:
            pickle.dump((command_ordering, cmd_counts), file)

        ranks = {}

        for idx, (cnt, token) in enumerate(command_ordering):
            ranks[token] = idx

        # Transform the new data point using the Sentence Transformer model
        new_embedding = transformer.encode(pending_outputs, convert_to_tensor=True).cpu().numpy()

        # Append the new embedding to the existing matrix
        output_matrix = np.vstack([output_matrix, new_embedding])

        with open(cache_path, "wb") as file:
            pickle.dump(output_matrix, file)

        pending_latex = []
        pending_outputs = []

    data = request.get_json()  # Assumes JSON data is sent in the request

    print(f"Received data: {data}", flush=True)

    pending_latex.append(data['latex'])
    pending_outputs.append(data['output'])

    write_file(data)

    query_latex = data['latex']
    query_output = transformer.encode([data['output']], convert_to_tensor=True)

    # calcluate latex score-- take average score for each token
    # the score for a given token is e to the power of its relative rank in the array
    # so if a command is the least common to occur in our existing data, we give it a score of e^0
    # if a command is not present at all, we give an extra boost by giving it a rank of -3

    latex_score = 0
    cnt = 1

    for token in tokenize(query_latex):
        if token.startswith('\\'):
            cnt += 1

            if token not in ranks:
                latex_score += math.exp(3)
            else:
                normalized_rank = (ranks[token] / len(ranks)) * 5
                # ignore bottom 20 percent because many of those are junk commands
                normalized_rank = max(0, normalized_rank - 1)
                print(normalized_rank)
                latex_score += math.exp(-normalized_rank)
    
    latex_score /= cnt

    # Calculate cosine similarity between the single encoding and all embeddings in the existing matrix
    output_similarity = np.mean(cosine_similarity(query_output.reshape(1, -1), output_matrix))
    
    print("Assert: ", output_similarity >= -1 and output_similarity <= 1, flush=True)

    print(latex_score, output_similarity)

    # calculate score
    score = latex_score * 10 + to_score(output_similarity)
    score *= 10

    # Use jsonify to create a JSON response
    response = jsonify({"score": score})

    # You can set the Content-Type header to application/json if needed
    response.headers['Content-Type'] = 'application/json'

    return response

if __name__ == '__main__':
    app.run(port=8000, debug=True)
