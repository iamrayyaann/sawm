from flask import Flask, render_template, request
import joblib
import requests
import numpy as np
from datetime import datetime
import os

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'), 
            static_folder=os.path.join(os.path.dirname(__file__), '..', 'static'))

# Load trained hydration model
hydration_model = joblib.load(os.path.join(os.path.dirname(__file__), '..', 'assets', 'hydration_model.pkl'))

@app.route('/')
def index():
    city = request.args.get('city', 'Riyadh')
    country = request.args.get('country', 'Saudi Arabia')
    method = request.args.get('method', '2')
    today = datetime.now().strftime('%d-%m-%Y')
    
    try:
        # Fetch prayer times
        prayer_url = f"https://api.aladhan.com/v1/timingsByCity?city={city}&country={country}&method={method}&date={today}"
        prayer_response = requests.get(prayer_url, timeout=5)
        prayer_data = prayer_response.json()
        
        timings = prayer_data['data']['timings']
        suhoor = timings['Fajr']
        iftar = timings['Maghrib']
        
        # Fetch weather
        weather_url = f"https://wttr.in/{city}?format=j1"
        weather_response = requests.get(weather_url, timeout=5)
        weather_data = weather_response.json()
        
        temp_c = int(weather_data['current_condition'][0]['temp_C'])
        humidity = int(weather_data['current_condition'][0]['humidity'])
        
        # Predict hydration using trained model
        try:
            features = np.array([[temp_c, humidity]])
            hydration = hydration_model.predict(features)[0]
        except Exception as e:
            print(f"Hydration prediction error: {e}")
            hydration = 2.5
    except Exception as e:
        print(f"API error: {e}")
        # Fallback values
        suhoor = "04:30"
        iftar = "18:30"
        temp_c = 25
        humidity = 50
        hydration = 2.5
    
    return render_template('index.html', 
                         suhoor=suhoor, 
                         iftar=iftar, 
                         temp=temp_c, 
                         humidity=humidity, 
                         hydration=round(hydration, 2), 
                         method=method)
