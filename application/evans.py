import PyPDF2
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def simi(file, d_path):
    result = {}
    

    one = PyPDF2.PdfReader(file)
    text = ''
    for x in one.pages:
        extract = x.extract_text()
    if extract:
        text += extract
    
    dirs = os.listdir(d_path)
    paths = [f"{d_path}/{x}" for x in dirs if x.endswith('.pdf')]
    
    for x in paths:
        with open(x, 'rb') as e:
            two = PyPDF2.PdfReader(e)
            text1 = ''
            for i in two.pages:
                extracted = i.extract_text()
                if extracted:
                    text1 += extracted
            vector = TfidfVectorizer(stop_words='english')
            matrix = vector.fit_transform([text, text1])
            cosine = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
            result[x] = cosine
    print(result)
    return result

