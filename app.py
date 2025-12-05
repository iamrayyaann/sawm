from flask import Flask, render_template, request, jsonify
import joblib
import requests
import numpy as np
from datetime import datetime


app = Flask(__name__)

# Load trained hydration model
try:
    hydration_model = joblib.load('assets/hydration_model.pkl')
except Exception as e:
    print(f"Warning: Could not load hydration model: {e}")
    hydration_model = None

@app.route('/')
def index():
    try:
        city = request.args.get('city', 'Riyadh')
        country = request.args.get('country', 'Saudi Arabia')
        method = request.args.get('method', '2')
        today = datetime.now().strftime('%d-%m-%Y')
        
        # Fetch prayer times
        prayer_url = f"http://api.aladhan.com/v1/timingsByCity?city={city}&country={country}&method={method}&date={today}"
        prayer_response = requests.get(prayer_url, timeout=10)
        prayer_data = prayer_response.json()
        
        timings = prayer_data['data']['timings']
        suhoor = timings['Fajr']
        iftar = timings['Maghrib']
        
        # Fetch weather
        weather_url = f"http://wttr.in/{city}?format=j1"
        weather_response = requests.get(weather_url, timeout=10)
        weather_data = weather_response.json()
        
        temp_c = int(weather_data['current_condition'][0]['temp_C'])
        humidity = int(weather_data['current_condition'][0]['humidity'])
        
        # Predict hydration using trained model
        hydration = 2.5  # Default value
        if hydration_model:
            try:
                features = np.array([[temp_c, humidity]])
                hydration = hydration_model.predict(features)[0]
            except Exception as e:
                print(f"Error predicting hydration: {e}")
                hydration = 2.5
        
        return render_template('index.html', suhoor=suhoor, iftar=iftar, temp=temp_c, humidity=humidity, hydration=round(hydration, 2), method=method)
    
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        # Return with default values if API fails
        return render_template('index.html', suhoor="05:30", iftar="18:00", temp=25, humidity=50, hydration=2.5, method='2')
    
    except Exception as e:
        print(f"Unexpected error in index route: {e}")
        import traceback
        traceback.print_exc()
        return render_template('index.html', suhoor="05:30", iftar="18:00", temp=25, humidity=50, hydration=2.5, method='2')


if __name__ == '__main__':
    app.run(debug=True)
