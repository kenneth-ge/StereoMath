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

import json

# Specify the path to your JSON file
json_file_path = 'combined.json'

# Open and read the JSON file
with open(json_file_path, 'r') as file:
    # Load JSON data from the file
    data = json.load(file)

latex_list = [item["latex"] for item in data]
output_list = [item["output"] for item in data]

def contains_only_symbols(input_string):
    for char in input_string:
        if char.isalpha() or char.isdigit():
            return False
    return True

def get_commands_or_symbols(input_str):
    return list(filter(lambda x: x.startswith('\\') or contains_only_symbols(x), tokenize(input_str)))

import nltk
from nltk import bigrams, FreqDist, LaplaceProbDist

# Step 1: Tokenize into words
words = []

for sentence in latex_list:
    for word in get_commands_or_symbols(tokenize(sentence)):
        words.append(word)

# Step 2: Create bigrams
bi_grams = list(bigrams(words))

# Step 3: Calculate frequency distribution of bigrams
freq_dist = FreqDist(bi_grams)

# Step 4: Laplace smoothing to handle unseen bigrams
prob_dist = LaplaceProbDist(freq_dist, bins=len(bi_grams))

# Step 5: Calculate the probability of a specific sequence
specific_sequence = "\\sin(x)"

def calculcate_prob(sentence):
    tokens = get_commands_or_symbols(tokenize(sentence))

    prob = 1

    for x in bigrams(tokens):
        print(x)
        prob *= prob_dist.prob(x)
    
    return prob

print(f"Probability of the sequence {specific_sequence}: {calculcate_prob(specific_sequence)}")
