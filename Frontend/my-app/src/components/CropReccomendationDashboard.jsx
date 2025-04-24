import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader, ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const CropRecommendationDashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    recommendations: true,
    details: false
  });

  // Get user's location or use default coordinates (Karjat)
  const [coordinates, setCoordinates] = useState({
    lat: 18.8306,
    lon: 73.2846
  });

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:2000/get_market?lat=${coordinates.lat}&lon=${coordinates.lon}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setMarketData(data);
        
        // Set the first crop as selected by default
        if (data.crop_summaries && data.crop_summaries.length > 0) {
          setSelectedCrop(data.crop_summaries[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch market data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [coordinates.lat, coordinates.lon]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getChartData = () => {
    if (!marketData || !marketData.crop_summaries) return [];
    
    return marketData.crop_summaries.map(crop => ({
      name: crop.Crop,
      currentPrice: crop["Current Price"],
      forecastNextMonth: crop["Forecasted Price (Next Month)"],
      forecast6Months: crop["Forecasted Price (6 Months)"],
      forecast1Year: crop["Forecasted Price (1 Year)"],
      trend1Month: crop["Short Term Trend (%)"],
      trend6Months: crop["Mid Term Trend (%)"],
      trend1Year: crop["Long Term Trend (%)"]
    }));
  };

  const getRecommendations = () => {
    if (!marketData || !marketData.crop_summaries) return [];
    
    // Sort crops by long-term price trend
    const sortedCrops = [...marketData.crop_summaries].sort((a, b) => 
      b["Long Term Trend (%)"] - a["Long Term Trend (%)"]
    );
    
    // Get top 3 rising crops
    const topRising = sortedCrops.slice(0, 3);
    
    // Get profitable short-term crops (positive short-term trend)
    const shortTermGood = marketData.crop_summaries
      .filter(crop => crop["Short Term Trend (%)"] > 5)
      .sort((a, b) => b["Short Term Trend (%)"] - a["Short Term Trend (%)"]);
    
    return {
      longTerm: topRising,
      shortTerm: shortTermGood.slice(0, 3)
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-12 h-12 text-green-600 animate-spin" />
        <p className="mt-4 text-lg text-gray-700">Loading market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 bg-red-100 rounded-lg border border-red-300">
          <h2 className="text-xl font-bold text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="mt-4">Please check if the Flask server is running at http://127.0.0.1:2000</p>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Crop Market Analysis & Recommendations</h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            Market insights and crop recommendations based on historical and forecasted prices
          </p>
        </div>

        {/* Market Overview Section */}
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div 
            className="px-6 py-4 bg-green-600 text-white flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('overview')}
          >
            <h2 className="text-xl font-semibold">Market Overview</h2>
            {expandedSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.overview && (
            <div className="p-6">
              <div className="prose max-w-none">
                <pre className="bg-gray-50 p-4 rounded text-sm text-gray-800 whitespace-pre-wrap">
                  {marketData.overall_summary}
                </pre>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Legend />
                      <Bar dataKey="currentPrice" name="Current Price" fill="#4ade80" />
                      <Bar dataKey="forecast1Year" name="1 Year Forecast" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div 
            className="px-6 py-4 bg-green-600 text-white flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('recommendations')}
          >
            <h2 className="text-xl font-semibold">Crop Recommendations</h2>
            {expandedSections.recommendations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.recommendations && (
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Long-term recommendations */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <TrendingUp className="mr-2" /> Long-Term Investment Crops
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">These crops show positive price trends over the next year</p>
                  
                  <ul className="space-y-4">
                    {recommendations.longTerm.map((crop, index) => (
                      <li key={index} className="flex justify-between items-start p-3 bg-white rounded-md shadow-sm">
                        <div>
                          <span className="font-medium text-gray-900">{crop.Crop}</span>
                          <p className="text-sm text-gray-500">Current: {formatPrice(crop["Current Price"])}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${crop["Long Term Trend (%)"] >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {crop["Long Term Trend (%)"] >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {crop["Long Term Trend (%)"].toFixed(1)}%
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(crop["Forecasted Price (1 Year)"])}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short-term recommendations */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    <ArrowRight className="mr-2" /> Short-Term Opportunities
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">These crops may offer good returns in the next 1-6 months</p>
                  
                  <ul className="space-y-4">
                    {recommendations.shortTerm.map((crop, index) => (
                      <li key={index} className="flex justify-between items-start p-3 bg-white rounded-md shadow-sm">
                        <div>
                          <span className="font-medium text-gray-900">{crop.Crop}</span>
                          <p className="text-sm text-gray-500">Current: {formatPrice(crop["Current Price"])}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${crop["Short Term Trend (%)"] >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {crop["Short Term Trend (%)"] >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {crop["Short Term Trend (%)"].toFixed(1)}%
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(crop["Forecasted Price (Next Month)"])}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Crop Analysis */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div 
            className="px-6 py-4 bg-green-600 text-white flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('details')}
          >
            <h2 className="text-xl font-semibold">Detailed Crop Analysis</h2>
            {expandedSections.details ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.details && (
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="crop-select" className="block text-sm font-medium text-gray-700 mb-2">Select Crop</label>
                <select
                  id="crop-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  value={selectedCrop?.Crop || ''}
                  onChange={(e) => {
                    const selected = marketData.crop_summaries.find(crop => crop.Crop === e.target.value);
                    setSelectedCrop(selected);
                  }}
                >
                  {marketData.crop_summaries.map((crop, index) => (
                    <option key={index} value={crop.Crop}>
                      {crop.Crop}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCrop && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedCrop.Crop} Analysis</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Price Information</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <dt className="text-sm text-gray-500">Current Price:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatPrice(selectedCrop["Current Price"])}</dd>
                        
                        <dt className="text-sm text-gray-500">Average Price:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatPrice(selectedCrop["Avg Price"])}</dd>
                        
                        <dt className="text-sm text-gray-500">Min Price:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatPrice(selectedCrop["Min Price"])}</dd>
                        
                        <dt className="text-sm text-gray-500">Max Price:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatPrice(selectedCrop["Max Price"])}</dd>
                        
                        <dt className="text-sm text-gray-500">Price Volatility:</dt>
                        <dd className="text-sm font-medium text-gray-900">{selectedCrop["Price Volatility (%)"].toFixed(1)}%</dd>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Growing Information</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <dt className="text-sm text-gray-500">Sowing Month:</dt>
                        <dd className="text-sm font-medium text-gray-900">{selectedCrop["Sowing Month"]}</dd>
                        
                        <dt className="text-sm text-gray-500">Harvest Month:</dt>
                        <dd className="text-sm font-medium text-gray-900">{selectedCrop["Harvest Month"]}</dd>
                        
                        <dt className="text-sm text-gray-500">Growth Duration:</dt>
                        <dd className="text-sm font-medium text-gray-900">{selectedCrop["Growth Duration (Months)"]} months</dd>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-2">Price Forecasts</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecasted Price</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">Next Month</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(selectedCrop["Forecasted Price (Next Month)"])}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedCrop["Short Term Trend (%)"] >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedCrop["Short Term Trend (%)"] >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {selectedCrop["Short Term Trend (%)"].toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">6 Months</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(selectedCrop["Forecasted Price (6 Months)"])}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedCrop["Mid Term Trend (%)"] >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedCrop["Mid Term Trend (%)"] >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {selectedCrop["Mid Term Trend (%)"].toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">1 Year</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(selectedCrop["Forecasted Price (1 Year)"])}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedCrop["Long Term Trend (%)"] >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedCrop["Long Term Trend (%)"] >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {selectedCrop["Long Term Trend (%)"].toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm text-gray-500">
                      Note: This forecast is based on historical data and market trends. Actual prices may vary based on weather conditions, policy changes, and other external factors.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendationDashboard;