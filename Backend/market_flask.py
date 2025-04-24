import os
import math
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend to prevent GUI errors

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.statespace.sarimax import SARIMAX
from datetime import datetime
import matplotlib.ticker as ticker
from textwrap import dedent
from flask import Flask, jsonify, request

# Set plot style for better visualization
plt.style.use('ggplot')
sns.set_palette("Set2")

# Directory containing crop data files
directory = "market_data"  # Update this path if needed

# List of crop CSV files
crop_files = [
    "Wheat.csv", "Tomato.csv", "Rice.csv", "Potato.csv", "Beans.csv",
    "Onion.csv", "Masur Dal.csv", "Maize.csv", "Bajra(Pearl Millet-Cumbu).csv", "Ajwan.csv"
]

# File with market latitude/longitude data
market_lat_long_file = "market_lat_long.csv"

def haversine(lat1, lon1, lat2, lon2):
    # Calculate the great circle distance between two points (in kilometers)
    R = 6371  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_closest_market(user_lat, user_lon):
    # Read market latitude/longitude data
    market_df = pd.read_csv(market_lat_long_file)
    # Drop rows with missing lat or lon
    market_df = market_df.dropna(subset=["Latitude", "Longitude"])
    # Compute distance from user point for each market
    market_df["Distance"] = market_df.apply(
        lambda row: haversine(user_lat, user_lon, row["Latitude"], row["Longitude"]), axis=1)
    # Get the market with the smallest distance
    closest = market_df.loc[market_df["Distance"].idxmin()]
    return closest["Market Name"]

def get_market(user_lat=None, user_lon=None):
    # If latitude and longitude are provided, determine the closest market name.
    closest_market = None
    if user_lat is not None and user_lon is not None:
        try:
            closest_market = get_closest_market(float(user_lat), float(user_lon))
            print(f"Closest market based on provided coordinates: {closest_market}")
        except Exception as e:
            print(f"Error determining closest market: {e}")
    
    # Store results for analysis and comparison
    crop_summaries = []
    price_change_data = []
    all_crops_forecast = {}

    # Create output directory for saving plots
    output_dir = "/Users/admin/Workspace/Crop Reccomendation/Frontend/my-app/public"
    os.makedirs(output_dir, exist_ok=True)

    print(f"Starting analysis of {len(crop_files)} crops...")

    output = {}

    for crop_file in crop_files:
        file_path = os.path.join(directory, crop_file)
        
        try:
            # Load dataset
            print(f"Processing {crop_file}...")
            df = pd.read_csv(file_path)
            
            # If available, filter by market name based on the closest market.
            # if closest_market and "Market Name" in df.columns:
            #     df = df[df["Market Name"] == closest_market]
            #     if df.empty:
            #         print(f"No data for {crop_file} in market: {closest_market}")
            #         continue
            
            # Get crop name from file
            crop_name = os.path.basename(crop_file).replace('.csv', '')
            
            # Convert 'Reported Date' column to DateTime format and set as index
            df['Reported Date'] = pd.to_datetime(df['Reported Date'], errors='coerce')
            
            # Check for date parsing issues
            if df['Reported Date'].isna().any():
                print(f"Warning: Found invalid dates in {crop_name}. Trying alternative formats...")
                for date_format in ["%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]:
                    try:
                        df['Reported Date'] = pd.to_datetime(df['Reported Date'], format=date_format, errors='coerce')
                        if not df['Reported Date'].isna().any():
                            print(f"Successfully parsed dates using format: {date_format}")
                            break
                    except Exception:
                        continue
            
            # Drop rows with invalid dates
            df = df.dropna(subset=['Reported Date'])
            if df.empty:
                print(f"Error: No valid data for {crop_name} after date parsing")
                continue
                
            df.set_index('Reported Date', inplace=True)
            
            # Handle missing price values
            if 'Modal Price (Rs./Quintal)' not in df.columns:
                print(f"Error: 'Modal Price (Rs./Quintal)' column not found in {crop_name}")
                print(f"Available columns: {df.columns.tolist()}")
                continue
                
            df['Modal Price (Rs./Quintal)'] = pd.to_numeric(df['Modal Price (Rs./Quintal)'], errors='coerce')
            df = df.ffill().bfill()
            df = df.sort_index()
            
            # Resample to monthly frequency
            monthly_df = df['Modal Price (Rs./Quintal)'].resample('M').mean()
            
            # Calculate basic statistics
            current_price = df['Modal Price (Rs./Quintal)'].iloc[-1]
            avg_price = df['Modal Price (Rs./Quintal)'].mean()
            min_price = df['Modal Price (Rs./Quintal)'].min()
            max_price = df['Modal Price (Rs./Quintal)'].max()
            price_volatility = df['Modal Price (Rs./Quintal)'].std() / avg_price * 100
            
            df['Year'] = df.index.year
            df['Month'] = df.index.month
            
            try:
                last_year = df['Year'].max() - 1
                last_year_avg_price = df[df['Year'] == last_year]['Modal Price (Rs./Quintal)'].mean()
                yoy_change = ((current_price - last_year_avg_price) / last_year_avg_price) * 100
            except Exception:
                last_year_avg_price = np.nan
                yoy_change = np.nan
                print(f"Warning: Could not calculate YoY change for {crop_name}")
            
            monthly_avg = df.groupby('Month')['Modal Price (Rs./Quintal)'].mean()
            try:
                sowing_month = monthly_avg.idxmin()
                harvest_month = monthly_avg.idxmax()
                growth_duration = (harvest_month - sowing_month) % 12 or 12
                
                month_names = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 
                               7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
                sowing_month_name = month_names[sowing_month]
                harvest_month_name = month_names[harvest_month]
            except Exception:
                sowing_month = sowing_month_name = harvest_month = harvest_month_name = np.nan
                growth_duration = np.nan
                print(f"Warning: Could not determine sowing/harvesting periods for {crop_name}")
            
            # Forecasting with SARIMA
            try:
                if len(monthly_df) < 24:
                    print(f"Warning: Limited data for {crop_name} ({len(monthly_df)} months). Forecast may be less reliable.")
                if len(monthly_df) > 36:
                    order = (2, 1, 2)
                    seasonal_order = (1, 1, 1, 12)
                else:
                    order = (1, 1, 1)
                    seasonal_order = (1, 0, 0, 12)
                
                model = SARIMAX(monthly_df, order=order, seasonal_order=seasonal_order,
                                enforce_stationarity=False, enforce_invertibility=False)
                model_fit = model.fit(disp=False)
                
                forecast_steps = 12
                future_dates = pd.date_range(start=monthly_df.index[-1], periods=forecast_steps + 1, freq='M')[1:]
                forecast = model_fit.forecast(steps=forecast_steps)
                
                next_month_price = forecast.iloc[0]
                six_month_price = forecast.iloc[5]
                one_year_price = forecast.iloc[-1]
                
                short_term_change = ((next_month_price - current_price) / current_price) * 100
                mid_term_change = ((six_month_price - current_price) / current_price) * 100
                long_term_change = ((one_year_price - current_price) / current_price) * 100
                
                all_crops_forecast[crop_name] = {
                    'dates': future_dates,
                    'prices': forecast,
                    'current_price': current_price
                }
                
                # Create individual forecast plot
                plt.figure(figsize=(12, 6))
                plt.plot(df.index, df['Modal Price (Rs./Quintal)'], label="Historical Prices", color="#1f77b4", alpha=0.7)
                plt.plot(future_dates, forecast, label="Forecasted Prices", color="#d62728", linestyle="dashed", linewidth=2)
                confidence = 0.15
                plt.fill_between(future_dates, forecast * (1 - confidence), forecast * (1 + confidence),
                                 color="#d62728", alpha=0.2, label="Forecast Range (±15%)")
                plt.xlabel("Date", fontsize=12)
                plt.ylabel("Price (Rs./Quintal)", fontsize=12)
                plt.title(f"{crop_name} Price History and Forecast", fontsize=14, fontweight='bold')
                plt.grid(True, alpha=0.3)
                plt.legend(loc="best")
                plt.gcf().autofmt_xdate()
                plt.annotate(f"Current: ₹{current_price:.0f}", 
                             xy=(df.index[-1], current_price),
                             xytext=(10, 20), textcoords="offset points",
                             arrowprops=dict(arrowstyle="->", connectionstyle="arc3,rad=.2"))
                plt.annotate(f"Forecast (1 yr): ₹{one_year_price:.0f} ({long_term_change:+.1f}%)", 
                             xy=(future_dates[-1], one_year_price),
                             xytext=(10, -30), textcoords="offset points",
                             arrowprops=dict(arrowstyle="->", connectionstyle="arc3,rad=.2"))
                plt.tight_layout()
                plt.savefig(os.path.join(output_dir, f"{crop_name}_forecast.png"), dpi=300)
                plt.close()
            except Exception as model_error:
                print(f"Forecasting error for {crop_name}: {model_error}")
                next_month_price = six_month_price = one_year_price = np.nan
                short_term_change = mid_term_change = long_term_change = np.nan
                future_dates = forecast = None
            
            crop_summaries.append({
                "Crop": crop_name,
                "Current Price": round(current_price, 2),
                "Avg Price": round(avg_price, 2),
                "Min Price": round(min_price, 2),
                "Max Price": round(max_price, 2),
                "Price Volatility (%)": round(price_volatility, 2),
                "Sowing Month": sowing_month_name,
                "Harvest Month": harvest_month_name,
                "Growth Duration (Months)": growth_duration,
                "Last Year Avg Price": round(last_year_avg_price, 2),
                "YoY Change (%)": round(yoy_change, 2),
                "Forecasted Price (Next Month)": round(next_month_price, 2),
                "Forecasted Price (6 Months)": round(six_month_price, 2),
                "Forecasted Price (1 Year)": round(one_year_price, 2),
                "Short Term Trend (%)": round(short_term_change, 2),
                "Mid Term Trend (%)": round(mid_term_change, 2),
                "Long Term Trend (%)": round(long_term_change, 2)
            })
            
            if not np.isnan(short_term_change) and not np.isnan(mid_term_change) and not np.isnan(long_term_change):
                price_change_data.append({
                    "Crop": crop_name,
                    "1 Month": short_term_change,
                    "6 Months": mid_term_change,
                    "12 Months": long_term_change
                })
        
        except Exception as e:
            print(f"Error processing {crop_file}: {e}")

    summary_df = pd.DataFrame(crop_summaries)
    summary_df = summary_df.sort_values(by="Forecasted Price (Next Month)", ascending=False)
    summary_csv_path = os.path.join(output_dir, "crop_analysis_summary.csv")
    summary_df.to_csv(summary_csv_path, index=False)
    print(f"\nComplete analysis saved to {summary_csv_path}")

    # (The rest of your visualization and summary-building code remains unchanged.)
    # For brevity, we assume the remaining code (plot generation and building summary strings)
    # is appended here, and the final output dictionary is built as before.
    
    # ... [Additional visualization and summary code] ...

    # Example: add overall summary key (you can modify as needed)
    avg_trend = summary_df["Long Term Trend (%)"].mean()
    rising_crops = summary_df[summary_df["Long Term Trend (%)"] > 0]["Crop"].tolist()
    falling_crops = summary_df[summary_df["Long Term Trend (%)"] < 0]["Crop"].tolist()
    overall_summary = (
        f"==== OVERALL MARKET ANALYSIS ====\n\n"
        f"Market: {closest_market if closest_market else 'All Markets'}\n"
        f"- Average 12-month price trend across all crops: {avg_trend:+.2f}%\n"
        f"- Crops with rising price forecast: {len(rising_crops)} out of {len(summary_df)}\n"
        f"- Crops with falling price forecast: {len(falling_crops)} out of {len(summary_df)}"
    )
    output['overall_summary'] = overall_summary
    
    # You can also attach other summaries as needed.
    output['crop_summaries'] = summary_df.to_dict(orient='records')
    
    return output

# Create Flask app
app = Flask(__name__)

@app.route('/get_market', methods=['GET'])
def market_insight():
    user_lat = request.args.get('lat')
    user_lon = request.args.get('lon')
    result = get_market(user_lat, user_lon)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=2000)
