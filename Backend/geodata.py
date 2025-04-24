from flask import Flask, request, jsonify
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from rasterio.transform import rowcol
from pyproj import Transformer, CRS
import plotly.subplots as sp
import plotly.graph_objects as go
from flask_cors import CORS
import pandas as pd
import numpy as np
import rasterio
import requests
import datetime
import time
import glob
import os
import re

app = Flask(__name__)
CORS(app)

def get_raster_values(lat, lon, raster_paths, default_crs="EPSG:32643"):
    results = {}

    for raster_path in raster_paths:
            with rasterio.open(raster_path) as dataset:
                dataset_crs = dataset.crs if dataset.crs else CRS.from_string(default_crs)

                transformer = Transformer.from_crs("EPSG:4326", dataset_crs, always_xy=True)
                x, y = transformer.transform(lon, lat)
                row, col = rowcol(dataset.transform, x, y)

                value = dataset.read(1)[row, col]

                min_val = dataset.read(1).min()
                max_val = dataset.read(1).max()
                
                # Extract filename without extension and store the value
                file_name = os.path.splitext(os.path.basename(raster_path))[0]
                
                if file_name == 'meanticd':
                    file_name = "inorganic_carbon_density"
                elif file_name == 'meantocd':
                    file_name = "organic_carbon_density"
            
                elif file_name =='fsalt':
                    file_name = "salt_affected"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name =='fwatero':
                    file_name = "water_erosion"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name =='fwindero':
                    file_name = "wind_erosion"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name =='fwaterlog':
                    file_name = "water_logging"
                    value = (value - min_val) / (max_val - min_val) * 100

                elif file_name.startswith('ffallow'):
                    file_name = "fallow"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name.startswith('fkharif'):
                    file_name = "kharif"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name.startswith('frabi'):
                    file_name = "rabi"
                    value = (value - min_val) / (max_val - min_val) * 100
                elif file_name.startswith('fnsa'):
                    file_name = "net_sown_area"
                    value = (value - min_val) / (max_val - min_val) * 100
                
                elif file_name.startswith('rootsm'):
                    file_name = "root_level_surface_moisture"
                elif file_name.startswith('s_runoff'):
                    file_name = "surface_runoff"
                elif file_name.startswith('upSMNRSC'):
                    file_name = "upper_level_surface_moisture"
                elif file_name.startswith('ocm2_vf'):
                    file_name = "vegetation_fraction"
                elif file_name.startswith('ocm2_ndvi_filt'):
                    file_name = "filtered_ndvi"
                elif file_name.startswith('localocm2'):
                    file_name = "local_ndvi"
                elif file_name.startswith('globalocm2'):
                    file_name = "global_ndvi"
                elif file_name.startswith('evaNHP'):
                    file_name = "evapotranspiration"

                results[file_name] = float(round(value, 2))

    return results

def classes_data(raster_values):
    new_dict={}

    soil_keys = ("floamy", "fclayey", "fclayskeletal", "fsandy")
    soil_values = {key: raster_values.get(key, 0) for key in soil_keys}
    max_soil_type = max(soil_values, key=soil_values.get)
    
    soil_depth_keys = (
        "fsoildep0_25", "fsoildep25_50", "fsoildep50_75",
        "fsoildep75_100", "fsoildep100_150", "fsoildep150_200"
    )
    soil_depth_values = {key: raster_values.get(key, 0) for key in soil_depth_keys}
    max_soil_depth = max(soil_depth_values, key=soil_depth_values.get)
    
    for key in list(raster_values.keys()):  
        if key not in soil_keys and key not in soil_depth_keys:
            new_dict[key] = raster_values[key]

    new_dict['soil_type'] = max_soil_type[1:]

    match = re.search(r"(\d+)_(\d+)", max_soil_depth)
    if match:
        start, end = match.groups()
        soil_depth = f"{start}-{end}m"

    new_dict['soil_depth'] = soil_depth
    
    new_dict['organic_carbon_density'] = round(new_dict['organic_carbon_density'],2)
    new_dict['inorganic_carbon_density'] = round(new_dict['inorganic_carbon_density'],2)

    return new_dict

def fetch_weather_data(lat, lon, years=5, delay=0):
    today = datetime.date.today() - datetime.timedelta(days=5)  # Adjust start date to 5 days prior
    start_year = today.year - years 
    end_year = today.year  
    
    all_data = []
    for year in range(start_year, end_year):
        start_date = f"{year}-{today.month:02d}-{today.day:02d}"
        end_date = f"{year + 1}-{today.month:02d}-{today.day:02d}" 

        url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
               f"&start_date={start_date}&end_date={end_date}"
               f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean"
               f"&timezone=auto")
        
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()

            if ("daily" in data and 
                "time" in data["daily"] and 
                "temperature_2m_max" in data["daily"] and 
                "temperature_2m_min" in data["daily"] and 
                "precipitation_sum" in data["daily"]):
                
                dates = data["daily"]["time"]
                temp_max = data["daily"]["temperature_2m_max"]
                temp_min = data["daily"]["temperature_2m_min"]
                rainfall = data["daily"]["precipitation_sum"]

                if "relative_humidity_2m_mean" in data["daily"]:
                    humidity = data["daily"]["relative_humidity_2m_mean"]
                else:
                    humidity = [None] * len(dates)
                    print("Humidity data not available")
                
                for i in range(len(dates)):
                    if temp_max[i] is not None and temp_min[i] is not None:
                        avg_temp = (temp_max[i] + temp_min[i]) / 2
                    else:
                        avg_temp = None

                    rain_val = rainfall[i] if rainfall[i] is not None else None
                    hum_val = humidity[i] if i < len(humidity) else None
                    
                    all_data.append([dates[i], avg_temp, rain_val, hum_val])
            else:
                print(f"Missing required data fields for {year}")
                print(f"Available fields: {data.get('daily', {}).keys()}")
        else:
            print(f"Error fetching data for {year}: {response.status_code}")
            print(f"Error message: {response.text}") 
        
        # Add delay between requests to avoid rate limiting
        if delay > 0 and year < end_year - 1:  # Don't delay after the last request
            time.sleep(delay)
    
    if all_data:
        df = pd.DataFrame(all_data, columns=["date", "Temperature", "Rainfall", "Humidity"])
        df["date"] = pd.to_datetime(df["date"])
        return df
    else:
        print("No data collected")
        return pd.DataFrame()
    

def forecast_lstm(df, forecast_periods=180, seq_length=10, epochs=50, batch_size=32):
    forecast_start_date = df.index[-1] + pd.Timedelta(days=1)
    future_dates = pd.date_range(start=forecast_start_date + pd.Timedelta(days=1), 
                                periods=forecast_periods)
    forecast_df = pd.DataFrame(index=future_dates)
    
    models = {}
    
    for column in df.columns:
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(df[column].values.reshape(-1, 1))
        
        X, y = [], []
        for i in range(len(scaled_data) - seq_length):
            X.append(scaled_data[i:(i + seq_length), 0])
            y.append(scaled_data[i + seq_length, 0])
        X, y = np.array(X), np.array(y)
        
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))

        model = Sequential()
        model.add(LSTM(50, return_sequences=True, input_shape=(seq_length, 1)))
        model.add(Dropout(0.2))
        model.add(LSTM(50))
        model.add(Dropout(0.2))
        model.add(Dense(1))
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0)
        models[column] = model
        
        predictions = []
        current_batch = scaled_data[-seq_length:].reshape(1, seq_length, 1)
        
        for i in range(forecast_periods):
            current_pred = model.predict(current_batch, verbose=0)[0]
            
            predictions.append(current_pred[0])
            
            current_batch = np.append(current_batch[:, 1:, :], 
                                     [[current_pred]], 
                                     axis=1)
            
        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        forecast_df[column] = predictions
    
    return forecast_df, models


def create_interactive_plots(df, output_file="weather.html"):
    df = df.copy()
    
    if 'Unnamed: 0' in df.columns:
        df.set_index('Unnamed: 0', inplace=True)
        df.index = pd.to_datetime(df.index)
    
    date_values = df.index
    
    fig = sp.make_subplots(
        rows=3, cols=1, 
        subplot_titles=('Air Temperature (°C)', 'Precipitation (mm)', 'Atmospheric Humidity (%)'),
        shared_xaxes=True,
        vertical_spacing=0.1
    )
    
    fig.add_trace(
        go.Scatter(x=date_values, y=df['Temperature'], mode='lines', name='Air Temperature', line=dict(color='red', width=3)),
        row=1, col=1
    )
    
    fig.add_trace(
        go.Scatter(x=date_values, y=df['Rainfall'], mode='lines', name='Precipitation', line=dict(color='blue', width=3)),
        row=2, col=1
    )
    
    fig.add_trace(
        go.Scatter(x=date_values, y=df['Humidity'], mode='lines', name='Atmospheric Humidity', line=dict(color='green', width=3)),
        row=3, col=1
    )
    
    fig.update_layout(
        height=800,
        width=900,
        plot_bgcolor="white",
        xaxis=dict(showgrid=True, gridcolor="lightgray"),
        yaxis=dict(title="Temperature (°C)", showgrid=True, gridcolor="lightgray"),
        xaxis2=dict(showgrid=True, gridcolor="lightgray"),
        yaxis2=dict(title="Rainfall (mm)", showgrid=True, gridcolor="lightgray"),
        xaxis3=dict(
            showgrid=True,
            gridcolor="lightgray",
            rangeselector=dict(
                buttons=list([
                    dict(count=3, label="3m", step="month", stepmode="backward"),
                    dict(count=6, label="6m", step="month", stepmode="backward"),
                    dict(count=9, label="9m", step="month", stepmode="backward"),
                    dict(count=12, label="1y", step="month", stepmode="backward"),
                ]),
                x=0.5,
                y=-0.15
            ),
            type="date"
        ),
        yaxis3=dict(title="Humidity (%)", showgrid=True, gridcolor="lightgray"),
        margin=dict(l=50, r=50, t=50, b=50),
    )
    
    output_folder = "/Users/admin/Workspace/Crop Reccomendation/Frontend/my-app/public"
    os.makedirs(output_folder, exist_ok=True)
    
    output_path = os.path.join(output_folder, output_file)
    fig.write_html(output_path)


@app.route('/get_data', methods=['GET'])
def get_data():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    forecast_period=120

    weather_df = fetch_weather_data(lat, lon, delay=2) 

    weather_df.set_index("date", inplace=True)
    weather_df.index = pd.to_datetime(weather_df.index)
    forecast_df, models = forecast_lstm(weather_df,forecast_periods=forecast_period)
    
    create_interactive_plots(forecast_df)
    weather_graph_path="weather.html"

    avg_temperature = forecast_df['Temperature'].mean()
    avg_humidity = forecast_df['Humidity'].mean()
    avg_rainfall = forecast_df['Rainfall'].mean()
    
    if lat is None or lon is None:
        return jsonify({"error": "Missing lat or lon parameters"}), 400
    
    folder_path = "gis_data"
    raster_files = glob.glob(os.path.join(folder_path, "*.asc")) + glob.glob(os.path.join(folder_path, "*.tif"))
    raster_values = get_raster_values(lat, lon, raster_files, "EPSG:32643")
    raster_values = classes_data(raster_values)

    raster_values['avg_temperature'] = round(float(avg_temperature),2)
    raster_values['avg_humidity'] = round(float(avg_humidity),2)
    raster_values['avg_rainfall'] = round(float(avg_rainfall),2)
    raster_values['weather_graph_path'] = weather_graph_path

    return jsonify(raster_values)

if __name__ == '__main__':
    app.run(debug=True,port=7000)






