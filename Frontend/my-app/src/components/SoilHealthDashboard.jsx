import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Thermometer, Droplets, Wind, Lock, Clipboard, 
  Layers, Sprout, Gauge, AlertTriangle, BookOpen } from 'lucide-react';

export default function SoilHealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 18.8306, lon: 73.2846 });
  const [inputCoordinates, setInputCoordinates] = useState({ lat: 18.8306, lon: 73.2846 });
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    fetchData(coordinates.lat, coordinates.lon);
  }, [coordinates]);

  useEffect(() => {
    if (data) {
      fetchCropRecommendations();
    }
  }, [data]);

  const fetchData = async (lat, lon) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:7000/get_data?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError('Failed to fetch data. Make sure the Flask server is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Gemini API call for crop recommendations
  const fetchCropRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      // Simulating API call with setTimeout
      setTimeout(() => {
        // This is a simulated response that would come from Gemini API
        const simulatedResponse = {
          recommendedCrops: [
            {
              name: "Sorghum (Jowar)",
              suitability: "High",
              reason: "Thrives in loamy soil with moderate water requirements. Good for regions with water erosion risk.",
              growingSeason: "Kharif"
            },
            {
              name: "Pearl Millet (Bajra)",
              suitability: "High",
              reason: "Drought resistant and suited for regions with moderate rainfall and temperatures above 30°C.",
              growingSeason: "Kharif"
            },
            {
              name: "Chickpea (Gram)",
              suitability: "Medium",
              reason: "Works well in loamy soil with moderate depth. Helps in nitrogen fixation.",
              growingSeason: "Rabi"
            },
            {
              name: "Pigeon Pea (Tur Dal)",
              suitability: "High",
              reason: "Thrives in loamy soil with moderate water needs and tolerates high temperatures.",
              growingSeason: "Kharif"
            },
            {
              name: "Cotton",
              suitability: "Medium",
              reason: "Suitable for loamy soil but requires good drainage. Consider the water erosion risk.",
              growingSeason: "Kharif to Rabi"
            }
          ],
          soilHealthImprovements: [
            "Consider crop rotation to improve soil organic matter",
            "Implement contour farming to reduce water erosion",
            "Add organic mulch to improve water retention",
            "Use cover crops during fallow periods"
          ]
        };
        
        setRecommendations(simulatedResponse);
        setLoadingRecommendations(false);
      }, 1500);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setLoadingRecommendations(false);
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
    { name: 'Root Moisture', value: data.root_level_surface_moisture * 100 },
    { name: 'Upper Moisture', value: data.upper_level_surface_moisture * 100 },
    { name: 'Surface Runoff', value: data.surface_runoff * 100 },
    { name: 'Evapotranspiration', value: data.evapotranspiration },
  ] : [];

  const climateData = data ? [
    { name: 'Temperature', value: data.avg_temperature },
    { name: 'Humidity', value: data.avg_humidity },
    { name: 'Rainfall', value: data.avg_rainfall },
  ] : [];

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
                  <BarChart data={climateData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} height={40} />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip formatter={(value, name) => [`${value}${name === 'Temperature' ? '°C' : name === 'Humidity' ? '%' : 'mm'}`, name]} />
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
            <div className="space-y-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moistureData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip formatter={(value) => [`${value}${value < 10 ? '%' : ''}`]} />
                  <Bar dataKey="value" fill="#36A2EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weather Chart from Flask */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Wind className="text-blue-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Weather Forecast</h2>
          </div>
          <div className="w-full h-96 overflow-hidden">
            <iframe 
              src={`http://127.0.0.1:7000/${data.weather_graph_path}`} 
              className="w-full h-full border-0"
              title="Weather Forecast"
            />
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
                <BarChart data={ndviData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <BookOpen className="text-green-600 mr-2" size={24} />
            <h2 className="text-xl font-bold text-gray-800">AI Crop Recommendations</h2>
          </div>
          
          {loadingRecommendations ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-2 text-green-600">Analyzing soil data for recommendations...</p>
            </div>
          ) : recommendations ? (
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-700">Recommended Crops</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {recommendations.recommendedCrops.map((crop, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    crop.suitability === 'High' 
                      ? 'border-green-500 bg-green-50' 
                      : crop.suitability === 'Medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-800">{crop.name}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        crop.suitability === 'High' 
                          ? 'bg-green-200 text-green-800' 
                          : crop.suitability === 'Medium'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                      }`}>
                        {crop.suitability}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{crop.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">Season: {crop.growingSeason}</p>
                  </div>
                ))}
              </div>
              
              <h3 className="font-semibold text-lg mb-3 text-gray-700">Soil Health Improvements</h3>
              <ul className="list-disc pl-5 space-y-1">
                {recommendations.soilHealthImprovements.map((tip, index) => (
                  <li key={index} className="text-gray-700">{tip}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600">Unable to generate recommendations at this time.</p>
          )}
        </div>

        {/* Soil Analysis Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
            
            <p className="text-gray-700 mt-3">
              <strong>Surface Moisture:</strong> Root level surface moisture ({data.root_level_surface_moisture * 100}%) and 
              upper level surface moisture ({data.upper_level_surface_moisture * 100}%) indicate
              {(data.root_level_surface_moisture + data.upper_level_surface_moisture) > 0.3 ? " adequate" : " low"} soil moisture content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}