# Sawm

Fasting times and hydration recommendation. Dark/light mode, location caching, and ML-based hydration predictions.

## Quick Start

```bash
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

## Features

- Dark/Light mode with persistent storage
- 30-day location caching
- Prayer times (Suhoor & Iftar) with 28 calculation methods
- ML-based hydration recommendations
- Temperature and humidity data
- GPS location detection
- Responsive design

## Usage

1. Set location: Enter "City, Country" or use the GPS icon
2. Choose calculation method (saved automatically)
3. View prayer times and hydration recommendations
4. Toggle dark/light mode from header

## Tech Stack

- Backend: Flask, scikit-learn, numpy
- Frontend: Vanilla JavaScript, CSS
- APIs: Aladhan (prayer times), wttr.in (weather), Nominatim (geocoding)
- Fonts: 0xProto
- Icons: Box Icons
