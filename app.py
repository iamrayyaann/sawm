from flask import Flask, request, jsonify
import joblib
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

# @app.route('/predict', methods=['POST'])
# def predict():
#     data = request.get_json()
#     model = joblib.load('model.joblib')
#     prediction = model.predict([data['features']])
#     return jsonify({'prediction': prediction.tolist()})

if __name__ == '__main__':
    app.run(debug=True)
