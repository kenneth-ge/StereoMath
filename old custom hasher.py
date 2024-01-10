from eli5.sklearn import InvertableHashingVectorizer
from eli5.sklearn import FeatureUnhasher
from sklearn.feature_extraction.text import HashingVectorizer
import math
import numpy as np

class DocumentVectorizer:
    def __init__(self):
        self.internal_vec = HashingVectorizer(tokenizer=self.tokenize)
        self.vectorizer = self.internal_vec #InvertableHashingVectorizer(self.internal_vec)
        self.hasher = self.vectorizer._get_hasher()
        self.feature_names = None
        
        # Initialize a dynamic vocabulary and document frequencies
        self.vocabulary = set()
        self.document_frequencies = {}
        self.idf_values = {}
        self.term_indices = {}
        
        self.total_documents = 0

    def calculate_idf(self, term, document_frequencies, total_documents):
        df = document_frequencies[term]
        idf = math.log((total_documents + 1) / (df + 1)) + 1
        return idf
        
    def fit_transform(self, documents):
        """
        Fit the vectorizer on the provided documents and transform them into feature vectors.
        """
        self.total_documents = len(documents)
        tf_matrix = self.vectorizer.fit_transform(documents)
        
        self.feature_names = {}
        
        for new_doc in documents:
            new_terms = self.tokenize(new_doc)
            processed = set()
            for new_term in new_terms:
                if new_term in processed:
                    continue
                processed.add(new_term)
                if new_term not in self.vocabulary:
                    self.vocabulary.add(new_term)
                    self.document_frequencies[new_term] = 1
                    
                    # get hash index
                    output = self.hasher.fit_transform(new_term)
                    print(output)
                else:
                    self.document_frequencies[new_term] += 1
        
        self.idf_values = {term: self.calculate_idf(term, self.document_frequencies, self.total_documents) for term in self.vocabulary}
        
        self.term_indices = {}
        
        for idx, term in enumerate(self.feature_names):
            if type(term) is list:
                for x in term:
                    self.term_indices[x['name']] = idx
                
        return self.transform_internal(tf_matrix)
        
    def transform(self, document):
        """
        Transform the provided documents into feature vectors.
        """
        if self.feature_names is None:
            raise ValueError("Vectorizer has not been fitted. Call fit_transform first.")

        tf_matrix = self.vectorizer.transform(document)
        
        return self.transform_internal(tf_matrix)

    def transform_internal(self, tf_matrix):
        tfidf_matrix = tf_matrix.copy()
        
        for term, idx in self.term_indices.items():
            tfidf_matrix[:, idx] = tf_matrix[:, idx] * self.idf_values[term]
        
        return tfidf_matrix
    
    def get_feature_names(self):
        """
        Get the feature names (terms) used by the vectorizer.
        """
        return self.feature_names
    
    def tokenize(self, input_str):
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