# Troubleshooting Guide - Internal Server Error Fix

## What Was Fixed

The **Internal Server Error (500)** was caused by several potential issues in the deployment environment:

### Issues Identified & Fixed:

1. **API Request Failures**
   - No timeout on external API calls (Prayer times & Weather)
   - Missing error handling for failed requests
   - No fallback values if APIs are unavailable
   - **Fixed**: Added 10-second timeout and graceful fallback to default values

2. **Model Loading Issues**
   - No error handling for joblib model file
   - App would crash if `assets/hydration_model.pkl` is missing
   - **Fixed**: Added try-catch with warning message and None check

3. **Template Variable Issues**
   - All required template variables now have defaults
   - If any API fails, app renders with default prayer times, weather, and hydration values
   - **Fixed**: Wrapped entire route in try-catch with sensible defaults

4. **Environment Issues**
   - Method parameter defaulting to '1' instead of '2'
   - No request timeout on external calls
   - **Fixed**: Changed default method to '2' (ISNA) and added timeouts

## Code Changes

### `/app.py` - Enhanced Error Handling

```python
# Before: Would crash if model missing
hydration_model = joblib.load('assets/hydration_model.pkl')

# After: Graceful handling
try:
    hydration_model = joblib.load('assets/hydration_model.pkl')
except Exception as e:
    print(f"Warning: Could not load hydration model: {e}")
    hydration_model = None
```

### API Request Changes

```python
# Before: No timeout, no error handling
prayer_response = requests.get(prayer_url)

# After: With timeout and error handling
prayer_response = requests.get(prayer_url, timeout=10)

# If API fails, return with defaults:
except requests.exceptions.RequestException as e:
    print(f"API Error: {e}")
    return render_template('index.html', 
        suhoor="05:30", 
        iftar="18:00", 
        temp=25, 
        humidity=50, 
        hydration=2.5, 
        method='2'
    )
```

## Deployment Checklist

- [x] Error handling for external APIs
- [x] Graceful fallback values
- [x] Model file optional loading
- [x] Request timeouts to prevent hanging
- [x] Proper exception logging
- [x] Template rendering always succeeds

## Testing the Fix

### Test 1: Normal Conditions
```bash
python app.py
# Visit http://localhost:5000
# Should display prayer times, weather, and hydration data
```

### Test 2: API Failure Simulation
- If Prayer API is down, app still renders with defaults
- If Weather API is down, app still renders with defaults
- If hydration model missing, app still renders (no hydration prediction)

### Test 3: Timeout Prevention
- API calls have 10-second timeout
- Page won't hang indefinitely if external API is slow

## Deployment Steps for Production

1. **Ensure assets directory exists**
   ```bash
   mkdir -p assets
   # Ensure hydration_model.pkl is present (optional)
   ```

2. **Install dependencies**
   ```bash
   pip install flask requests joblib numpy
   ```

3. **Set Flask environment for production**
   ```bash
   export FLASK_ENV=production
   export FLASK_APP=app.py
   ```

4. **Use production WSGI server** (not Flask's debug server)
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

5. **Add to requirements.txt** (if not already present)
   ```
   Flask==2.3.0
   requests==2.31.0
   joblib==1.3.0
   numpy==1.24.0
   ```

## Environment Variables (Optional)

```bash
# Set custom default city
SAWM_CITY="London"
SAWM_COUNTRY="UK"

# Set API timeout
SAWM_API_TIMEOUT="15"

# Enable debug logging
SAWM_DEBUG="true"
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 Error on load | API timeout/failure | Error fixed - now uses defaults |
| Prayer times wrong | API unavailable | App shows defaults (05:30 & 18:00) |
| Hydration not showing | Model missing | App loads but hydration = 2.5L default |
| Page loads but no data | Template issue | Check browser console for JS errors |
| Slow page load | Slow APIs | 10-second timeout prevents hanging |

## Monitoring & Logs

The app now logs errors to console:
```bash
# Start with logging to file
python app.py 2>&1 | tee sawm.log

# Check for errors
grep -i "error\|exception" sawm.log
```

## Vercel Deployment Specific

If deploying on Vercel:

1. **api/index.py** structure (if applicable):
```python
from app import app

# Vercel uses WSGI handler
```

2. **vercel.json** configuration:
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "outputDirectory": ".",
  "env": {
    "PYTHONUNBUFFERED": "1"
  }
}
```

3. **Common Vercel Issues**:
   - **Cold starts**: Normal, first request is slower
   - **Timeouts**: Increased timeout to 10s helps
   - **Missing files**: Ensure `assets/` directory is committed to Git

## Next Steps

1. Deploy the fixed version
2. Monitor error logs for first 24 hours
3. If issues persist, check:
   - External API availability
   - File permissions on server
   - Python version compatibility
   - Memory/CPU limits

---

✅ **The fix is ready for deployment!** The app is now much more robust and will handle failures gracefully.
