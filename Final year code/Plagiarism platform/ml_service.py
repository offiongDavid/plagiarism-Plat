from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy

app = Flask(__name__)
CORS(app)

nlp = spacy.load('en_core_web_sm')

@app.route('/compare', methods=['POST'])
def compare_texts():
    data = request.get_json()
    user_text = data['userText']
    documents = data['documents']

    user_doc = nlp(user_text)
    highest_similarity = 0

    for doc_text in documents:
        compare_doc = nlp(doc_text)
        similarity = user_doc.similarity(compare_doc)
        highest_similarity = max(highest_similarity, similarity)

    result_percent = round(highest_similarity * 100, 2)
    return jsonify({ 'result': f'{result_percent}% similarity' })

if __name__ == '__main__':
    app.run(port=8000)
