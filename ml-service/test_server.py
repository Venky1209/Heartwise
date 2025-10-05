#!/usr/bin/env python3
"""Minimal Flask test"""
from flask import Flask, jsonify
from flask_cors import CORS
import os

os.environ['GEMINI_API_KEY'] = "AIzaSyCOhi-mbRiu8cxB8EaljPFGlYN2KKC_yKM"

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "Test"})

@app.route('/test-gemini', methods=['GET'])
def test_gemini():
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.environ['GEMINI_API_KEY'])
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Say hello in 3 words")
        return jsonify({"status": "success", "response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting test server on port 5003...")
    app.run(host='0.0.0.0', port=5003, debug=False)
