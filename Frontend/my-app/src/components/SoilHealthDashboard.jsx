import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Thermometer, Droplets, Wind, Lock, Clipboard, 
  Layers, Sprout, Gauge, AlertTriangle, Brain } from 'lucide-react';

export default function SoilHealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [inputCoordinates, setInputCoordinates] = useState({ lat: 18.8306, lon: 73.2846 });
  const [recommendations, setRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    // Only fetch data if coordinates are not null
    if (coordinates && coordinates.lat !== null && coordinates.lon !== null) {
      fetchData(coordinates.lat, coordinates.lon);
    }
  }, [coordinates]);

  const fetchData = async (lat, lon) => {
    setLoading(true);
    setRecommendations(null);
    setAiError(null);
    try {
      const response = await fetch(`http://127.0.0.1:7000/get_data?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      setData(jsonData);
      
      // Auto-fetch recommendations when soil data is loaded
      fetchCropRecommendations(jsonData);
    } catch (err) {
      setError('Failed to fetch data. Make sure the Flask server is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCropRecommendations = async (soilData) => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      const apiKey =""; // Ensure you have your API key in .env file
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please check your .env file.');
      }
      
      // Prepare prompt for Gemini
      const prompt = `
        Analyze this soil data and provide crop recommendations with detailed insights:
        
        Soil Type: ${soilData.soil_type}
        Soil Depth: ${soilData.soil_depth}
        Organic Carbon Density: ${soilData.organic_carbon_density} kg/m³
        Inorganic Carbon Density: ${soilData.inorganic_carbon_density} kg/m³
        
        Climate:
        - Temperature: ${soilData.avg_temperature}°C
        - Humidity: ${soilData.avg_humidity}%
        - Rainfall: ${soilData.avg_rainfall}mm
        
        Soil Moisture:
        - Root Level: ${soilData.root_level_surface_moisture * 100}%
        - Upper Level: ${soilData.upper_level_surface_moisture * 100}%
        - Surface Runoff: ${soilData.surface_runoff * 100}%
        - Evapotranspiration: ${soilData.evapotranspiration}
        
        Soil Risks:
        - Water Erosion Risk: ${soilData.water_erosion}%
        - Wind Erosion Risk: ${soilData.wind_erosion}%
        - Water Logging Risk: ${soilData.water_logging}%
        - Salt Affected Level: ${soilData.salt_affected}%
        
        Vegetation Health:
        - Local NDVI: ${soilData.local_ndvi}
        - Global NDVI: ${soilData.global_ndvi}
        - Filtered NDVI: ${soilData.filtered_ndvi}
        - Vegetation Fraction: ${soilData.vegetation_fraction}%
        
        Current Cultivation:
        - Kharif Crops: ${soilData.kharif}%
        - Rabi Crops: ${soilData.rabi}%
        - Fallow Land: ${soilData.fallow}%
        - Net Sown Area: ${soilData.net_sown_area}%
        
        Based on this data, provide:
        1. Top 3-5 recommended crops that would grow well in these conditions
        2. For each crop, explain why it's suitable given the soil conditions
        3. Farming practices recommended for this soil
        4. Any soil improvements or treatments that might be beneficial
        5. Risk factors to watch out for
        
        Format response as JSON with the following structure:
        {
          "recommendedCrops": [
            {
              "name": "crop name",
              "suitability": "high/medium/low",
              "reasons": ["reason 1", "reason 2"]
            }
          ],
          "farmingPractices": ["practice 1", "practice 2"],
          "soilImprovements": ["improvement 1", "improvement 2"],
          "riskFactors": ["risk 1", "risk 2"],
          "insights": "overall analysis and additional insights"
        }
      `;

      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      // Extract the JSON response from Gemini's text response
      const textResponse = result.candidates[0].content.parts[0].text;
      let jsonResponse;
      
      // Parse the JSON from the text response
      try {
        // Extract JSON object from text (in case Gemini adds explanatory text before/after)
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not find valid JSON in response');
        }
      } catch (jsonError) {
        console.error('Failed to parse Gemini JSON response:', jsonError);
        throw new Error('Failed to parse crop recommendations from AI');
      }
      
      setRecommendations(jsonResponse);
    } catch (err) {
      setAiError(`Failed to get recommendations: ${err.message}`);
      console.error('recommendation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCoordinates({ ...inputCoordinates });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputCoordinates(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const SUITABILITY_COLORS = {
    high: '#4CAF50',
    medium: '#FFC107',
    low: '#F44336'
  };

  // Define all data variables that depend on the data state
  // This ensures they're defined before they're used in the JSX
  const cropData = data ? [
    { name: 'Kharif', value: data.kharif },
    { name: 'Rabi', value: data.rabi },
    { name: 'Fallow', value: data.fallow },
    { name: 'Net Sown Area', value: data.net_sown_area },
  ] : [];

  const ndviData = data ? [
    { name: 'Local NDVI', value: data.local_ndvi },
    { name: 'Global NDVI', value: data.global_ndvi },
    { name: 'Filtered NDVI', value: data.filtered_ndvi },
    { name: 'Vegetation Fraction', value: data.vegetation_fraction },
  ] : [];

  const soilRiskData = data ? [
    { subject: 'Water Erosion', A: data.water_erosion, fullMark: 100 },
    { subject: 'Wind Erosion', A: data.wind_erosion, fullMark: 100 },
    { subject: 'Water Logging', A: data.water_logging, fullMark: 100 },
    { subject: 'Salt Affected', A: data.salt_affected, fullMark: 100 },
  ] : [];

  const moistureData = data ? [
    { name: 'Root Level', value: data.root_level_surface_moisture * 100 },
    { name: 'Upper Level', value: data.upper_level_surface_moisture * 100 },
    { name: 'Surface Runoff', value: data.surface_runoff * 100 },
    { name: 'Evapotranspiration', value: data.evapotranspiration },
  ] : [];

  const climateData = data ? [
    { name: 'Temperature (°C)', value: data.avg_temperature },
    { name: 'Humidity (%)', value: data.avg_humidity },
    { name: 'Rainfall (mm)', value: data.avg_rainfall },
  ] : [];

  // Display a welcome message or instructions when no data is loaded yet
  if (!data && !loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Soil Health Dashboard</h1>
            <p className="text-lg text-gray-600 mb-6">Enter coordinates to fetch soil health data.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label htmlFor="lat" className="text-sm font-medium text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  step="any"
                  value={inputCoordinates.lat}
                  onChange={handleInputChange}
                  className="border rounded p-2 w-40"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="lon" className="text-sm font-medium text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  id="lon"
                  name="lon"
                  step="any"
                  value={inputCoordinates.lon}
                  onChange={handleInputChange}
                  className="border rounded p-2 w-40"
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Fetch Data
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-2 text-lg font-medium text-blue-500">Loading soil data...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Only render the dashboard if data exists
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Soil Health Dashboard</h1>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label htmlFor="lat" className="text-sm font-medium text-gray-600 mb-1">Latitude</label>
              <input
                type="number"
                id="lat"
                name="lat"
                step="any"
                value={inputCoordinates.lat}
                onChange={handleInputChange}
                className="border rounded p-2 w-40"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="lon" className="text-sm font-medium text-gray-600 mb-1">Longitude</label>
              <input
                type="number"
                id="lon"
                name="lon"
                step="any"
                value={inputCoordinates.lon}
                onChange={handleInputChange}
                className="border rounded p-2 w-40"
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Fetch Data
              </button>
            </div>
          </form>
        </div>

        {/* Basic Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Layers className="text-amber-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Soil Properties</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Soil Type:</span>
                <span className="font-medium text-gray-800 capitalize">{data.soil_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Soil Depth:</span>
                <span className="font-medium text-gray-800">{data.soil_depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Organic Carbon Density:</span>
                <span className="font-medium text-gray-800">{data.organic_carbon_density} kg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inorganic Carbon Density:</span>
                <span className="font-medium text-gray-800">{data.inorganic_carbon_density} kg/m³</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Thermometer className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Climate</h2>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                  <Thermometer size={28} className="text-red-500 mb-1" />
                  <span className="text-lg font-bold text-gray-800">{data.avg_temperature}°C</span>
                  <span className="text-xs text-gray-500">Temperature</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <Droplets size={28} className="text-blue-500 mb-1" />
                  <span className="text-lg font-bold text-gray-800">{data.avg_humidity}%</span>
                  <span className="text-xs text-gray-500">Humidity</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-cyan-50 rounded-lg">
                  <Wind size={28} className="text-cyan-500 mb-1" />
                  <span className="text-lg font-bold text-gray-800">{data.avg_rainfall}mm</span>
                  <span className="text-xs text-gray-500">Rainfall</span>
                </div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={climateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Sprout className="text-green-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Vegetation & Moisture</h2>
            </div>
            <div className="space-y-3">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moistureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#36A2EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Clipboard className="text-green-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Crop Cultivation</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {cropData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Coverage']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Gauge className="text-purple-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">NDVI & Vegetation Metrics</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ndviData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-yellow-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Soil Risk Analysis</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={soilRiskData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Risk Level (%)" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip formatter={(value) => [`${value}%`, 'Risk Level']} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Analysis Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Lock className="text-blue-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Soil Analysis Summary</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700">
              <strong>Soil Type & Quality:</strong> {data.soil_type} soil with depth {data.soil_depth}. 
              The organic carbon density is {data.organic_carbon_density} kg/m³ and inorganic carbon density is {data.inorganic_carbon_density} kg/m³.
            </p>
            
            <p className="text-gray-700 mt-3">
              <strong>Climate Conditions:</strong> Average temperature of {data.avg_temperature}°C with {data.avg_humidity}% humidity 
              and {data.avg_rainfall}mm rainfall expected in the forecast period.
            </p>
            
            <p className="text-gray-700 mt-3">
              <strong>Soil Risks:</strong> 
              Water erosion risk is {data.water_erosion > 75 ? "high" : data.water_erosion > 50 ? "moderate" : "low"} ({data.water_erosion}%). 
              Wind erosion risk is {data.wind_erosion > 75 ? "high" : data.wind_erosion > 50 ? "moderate" : "low"} ({data.wind_erosion}%). 
              Salt affected level is {data.salt_affected > 75 ? "high" : data.salt_affected > 50 ? "moderate" : "low"} ({data.salt_affected}%).
            </p>
            
            <p className="text-gray-700 mt-3">
              <strong>Cultivation Analysis:</strong> The area has {data.net_sown_area}% net sown area with
              {data.kharif}% Kharif crops, {data.rabi}% Rabi crops, and {data.fallow}% fallow land.
            </p>
            
            <p className="text-gray-700 mt-3">
              <strong>Vegetation Health:</strong> Based on NDVI values (Local: {data.local_ndvi}, Global: {data.global_ndvi}, Filtered: {data.filtered_ndvi}) 
              and vegetation fraction of {data.vegetation_fraction}%, the overall vegetation health is 
              {data.filtered_ndvi > 70 ? " good" : data.filtered_ndvi > 50 ? " moderate" : " poor"}.
            </p>
          </div>
        </div>

        {/* AI Crop Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Brain className="text-indigo-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Crop Recommendations</h2>
          </div>
          
          {aiLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-2 text-indigo-500">Analyzing soil data...</p>
            </div>
          )}
          
          {aiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center mb-2">
                <AlertTriangle size={20} className="text-red-500 mr-2" />
                <p className="font-medium text-red-700">Error Getting Recommendations</p>
              </div>
              <p className="text-red-600">{aiError}</p>
              <button 
                className="mt-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                onClick={() => data && fetchCropRecommendations(data)}
              >
                Try Again
              </button>
            </div>
          )}
          
          {recommendations && !aiLoading && !aiError && (
            <div className="space-y-6">
              {/* Recommended Crops */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Crops</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.recommendedCrops.map((crop, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-3 text-white font-medium" 
                        style={{ backgroundColor: SUITABILITY_COLORS[crop.suitability.toLowerCase()] }}
                      >
                        {crop.name} - {crop.suitability} Suitability
                      </div>
                      <div className="p-3">
                        <ul className="list-disc pl-5 space-y-1">
                          {crop.reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-gray-700">{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Farming Practices */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Farming Practices</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.farmingPractices.map((practice, index) => (
                      <li key={index} className="text-gray-700">{practice}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Soil Improvements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Soil Improvement Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.soilImprovements.map((improvement, index) => (
                      <li key={index} className="text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Risk Factors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Factors to Watch</h3>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.riskFactors.map((risk, index) => (
                      <li key={index} className="text-gray-700">{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Overall Insights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis Insights</h3>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                  <p className="text-gray-700">{recommendations.insights}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}