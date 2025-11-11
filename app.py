from flask import Flask, render_template, request, jsonify
import joblib
import requests
import numpy as np
from datetime import datetime


app = Flask(__name__)

# Load trained hydration model
hydration_model = joblib.load('assets/hydration_model.pkl')

@app.route('/')
def index():
    city = request.args.get('city', 'Riyadh')
    country = request.args.get('country', 'Saudi Arabia')
    method = request.args.get('method', '1')
    today = datetime.now().strftime('%d-%m-%Y')
    
    # Fetch prayer times
    prayer_url = f"http://api.aladhan.com/v1/timingsByCity?city={city}&country={country}&method={method}&date={today}"
    prayer_response = requests.get(prayer_url)
    prayer_data = prayer_response.json()
    
    timings = prayer_data['data']['timings']
    suhoor = timings['Fajr']
    iftar = timings['Maghrib']
    
    # Fetch weather
    weather_url = f"http://wttr.in/{city}?format=j1"
    weather_response = requests.get(weather_url)
    weather_data = weather_response.json()
    
    temp_c = int(weather_data['current_condition'][0]['temp_C'])
    humidity = int(weather_data['current_condition'][0]['humidity'])
    
    # Predict hydration using trained model
    try:
        features = np.array([[temp_c, humidity]])
        hydration = hydration_model.predict(features)[0]
    except Exception as e:
        print(f"Error predicting hydration: {e}")
        hydration = 2.5  # Default fallback
    
    return render_template('index.html', suhoor=suhoor, iftar=iftar, temp=temp_c, humidity=humidity, hydration=round(hydration, 2), method=method)


if __name__ == '__main__':
    app.run(debug=True)
