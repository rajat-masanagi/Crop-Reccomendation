// import { useState, useEffect } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// const CropRecommendationDashboard = () => {
//   const [cropData, setCropData] = useState([]);
//   const [overallSummary, setOverallSummary] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedCrop, setSelectedCrop] = useState(null);
//   const [userCoords, setUserCoords] = useState({ lat: null, lon: null });

//   useEffect(() => {
//     // Get user location if possible
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setUserCoords({
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           });
//         },
//         (err) => {
//           console.warn("Error getting location:", err);
//           fetchMarketData(); // Fallback to fetching without coordinates
//         }
//       );
//     } else {
//       fetchMarketData(); // Fallback if geolocation not available
//     }
//   }, []);

//   useEffect(() => {
//     // Fetch data when coordinates are available
//     if (userCoords.lat && userCoords.lon) {
//       fetchMarketData(userCoords.lat, userCoords.lon);
//     }
//   }, [userCoords]);

//   const fetchMarketData = async (lat = null, lon = null) => {
//     setLoading(true);
//     try {
//       const url = new URL("http://localhost:2000/get_market");
//       if (lat && lon) {
//         url.searchParams.append("lat", lat);
//         url.searchParams.append("lon", lon);
//       }

//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const data = await response.json();
//       setCropData(data.crop_summaries);
//       setOverallSummary(data.overall_summary);
//       setLoading(false);
//     } catch (err) {
//       setError(`Failed to fetch data: ${err.message}`);
//       setLoading(false);
//     }
//   };

//   const priceChangeData = cropData.map((crop) => ({
//     name: crop.Crop,
//     "Short Term (1 Month)": crop["Short Term Trend (%)"],
//     "Mid Term (6 Months)": crop["Mid Term Trend (%)"],
//     "Long Term (1 Year)": crop["Long Term Trend (%)"],
//   }));

//   const handleCropSelect = (crop) => {
//     setSelectedCrop(crop);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-4 max-w-6xl">
//       <h1 className="text-3xl font-bold mb-6 text-center text-green-700">
//         Crop Price Analysis & Recommendations
//       </h1>
      
//       {/* Market Summary */}
//       <div className="bg-green-50 p-4 rounded-lg shadow mb-6">
//         <h2 className="text-xl font-semibold mb-2">Market Overview</h2>
//         <pre className="whitespace-pre-wrap">{overallSummary}</pre>
//       </div>

//       {/* Price Trend Chart */}
//       <div className="bg-white p-4 rounded-lg shadow mb-6">
//         <h2 className="text-xl font-semibold mb-4">Price Trend Forecast (%)</h2>
//         <ResponsiveContainer width="100%" height={400}>
//           <BarChart data={priceChangeData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
//             <YAxis label={{ value: "Price Change (%)", angle: -90, position: "insideLeft" }} />
//             <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
//             <Legend />
//             <Bar dataKey="Short Term (1 Month)" fill="#8884d8" />
//             <Bar dataKey="Mid Term (6 Months)" fill="#82ca9d" />
//             <Bar dataKey="Long Term (1 Year)" fill="#ffc658" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Crop Recommendations Table */}
//       <div className="bg-white p-4 rounded-lg shadow">
//         <h2 className="text-xl font-semibold mb-4">Crop Analysis & Recommendations</h2>
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white">
//             <thead className="bg-green-100">
//               <tr>
//                 <th className="py-2 px-4 text-left">Crop</th>
//                 <th className="py-2 px-4 text-right">Current Price</th>
//                 <th className="py-2 px-4 text-right">1-Month Forecast</th>
//                 <th className="py-2 px-4 text-right">6-Month Forecast</th>
//                 <th className="py-2 px-4 text-right">1-Year Forecast</th>
//                 <th className="py-2 px-4 text-right">Volatility</th>
//                 <th className="py-2 px-4 text-center">Details</th>
//               </tr>
//             </thead>
//             <tbody>
//               {cropData.map((crop, index) => (
//                 <tr 
//                   key={crop.Crop} 
//                   className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
//                   onClick={() => handleCropSelect(crop)}
//                 >
//                   <td className="py-2 px-4 font-medium">{crop.Crop}</td>
//                   <td className="py-2 px-4 text-right">₹{crop["Current Price"].toLocaleString()}</td>
//                   <td className={`py-2 px-4 text-right ${crop["Short Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
//                     ₹{crop["Forecasted Price (Next Month)"].toLocaleString()} 
//                     <span className="ml-1">({crop["Short Term Trend (%)"].toFixed(1)}%)</span>
//                   </td>
//                   <td className={`py-2 px-4 text-right ${crop["Mid Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
//                     ₹{crop["Forecasted Price (6 Months)"].toLocaleString()}
//                     <span className="ml-1">({crop["Mid Term Trend (%)"].toFixed(1)}%)</span>
//                   </td>
//                   <td className={`py-2 px-4 text-right ${crop["Long Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
//                     ₹{crop["Forecasted Price (1 Year)"].toLocaleString()}
//                     <span className="ml-1">({crop["Long Term Trend (%)"].toFixed(1)}%)</span>
//                   </td>
//                   <td className="py-2 px-4 text-right">{crop["Price Volatility (%)"].toFixed(1)}%</td>
//                   <td className="py-2 px-4 text-center">
//                     <button 
//                       className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
//                     >
//                       View
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal for crop details */}
//       {selectedCrop && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold">{selectedCrop.Crop}</h2>
//               <button 
//                 onClick={() => setSelectedCrop(null)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//               <div>
//                 <img 
//                   src={`/output/${selectedCrop.Crop}_forecast.png`} 
//                   alt={`${selectedCrop.Crop} forecast chart`}
//                   className="w-full rounded shadow"
//                 />
//               </div>
              
//               <div className="space-y-4">
//                 <div className="bg-gray-50 p-4 rounded">
//                   <h3 className="font-semibold text-lg mb-2">Growing Calendar</h3>
//                   <p><span className="font-medium">Sowing Month:</span> {selectedCrop["Sowing Month"]}</p>
//                   <p><span className="font-medium">Harvest Month:</span> {selectedCrop["Harvest Month"]}</p>
//                   <p><span className="font-medium">Growth Duration:</span> {selectedCrop["Growth Duration (Months)"]} months</p>
//                 </div>
                
//                 <div className="bg-gray-50 p-4 rounded">
//                   <h3 className="font-semibold text-lg mb-2">Price History</h3>
//                   <p><span className="font-medium">Average Price:</span> ₹{selectedCrop["Avg Price"].toLocaleString()}</p>
//                   <p><span className="font-medium">Price Range:</span> ₹{selectedCrop["Min Price"].toLocaleString()} - ₹{selectedCrop["Max Price"].toLocaleString()}</p>
//                   <p><span className="font-medium">Year-over-Year Change:</span> {selectedCrop["YoY Change (%)"].toFixed(2)}%</p>
//                 </div>
                
//                 <div className="bg-gray-50 p-4 rounded">
//                   <h3 className="font-semibold text-lg mb-2">Market Recommendation</h3>
//                   {selectedCrop["Long Term Trend (%)"] > 10 ? (
//                     <p className="text-green-600 font-medium">Strong potential for price increase in the coming year. Consider growing this crop if suitable for your land.</p>
//                   ) : selectedCrop["Long Term Trend (%)"] > 0 ? (
//                     <p className="text-blue-600 font-medium">Modest price growth expected. Could be a stable option.</p>
//                   ) : selectedCrop["Long Term Trend (%)"] > -10 ? (
//                     <p className="text-yellow-600 font-medium">Slight price decline expected. Consider carefully.</p>
//                   ) : (
//                     <p className="text-red-600 font-medium">Significant price decline expected. May not be economically viable unless costs are low.</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CropRecommendationDashboard;
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const CropRecommendationDashboard = () => {
  const [cropData, setCropData] = useState([]);
  const [overallSummary, setOverallSummary] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [cropAnalysis, setCropAnalysis] = useState([]);
  const [marketMetrics, setMarketMetrics] = useState({
    bestPrice: null,
    worstPrice: null,
    bestTrend: null,
    worstTrend: null,
    leastVolatile: null,
    mostVolatile: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: null, lon: null });
  const [activeMetricTab, setActiveMetricTab] = useState("trends");

  useEffect(() => {
    // Get user location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Error getting location:", err);
          fetchMarketData(); // Fallback to fetching without coordinates
        }
      );
    } else {
      fetchMarketData(); // Fallback if geolocation not available
    }
  }, []);

  useEffect(() => {
    // Fetch data when coordinates are available
    if (userCoords.lat && userCoords.lon) {
      fetchMarketData(userCoords.lat, userCoords.lon);
    }
  }, [userCoords]);

  const fetchMarketData = async (lat = null, lon = null) => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:2000/get_market");
      if (lat && lon) {
        url.searchParams.append("lat", lat);
        url.searchParams.append("lon", lon);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setCropData(data.crop_summaries);
      setOverallSummary(data.overall_summary);
      setCropAnalysis(data.crop_analysis);
      setRecommendations(data.recommendation);
      
      // Set market metrics
      setMarketMetrics({
        bestPrice: data.best_price,
        worstPrice: data.worst_price,
        bestTrend: data.best_trend,
        worstTrend: data.worst_trend,
        leastVolatile: data.least_volatile,
        mostVolatile: data.most_volatile,
      });
      
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      setLoading(false);
    }
  };

  const priceChangeData = cropData.map((crop) => ({
    name: crop.Crop,
    "Short Term (1 Month)": crop["Short Term Trend (%)"],
    "Mid Term (6 Months)": crop["Mid Term Trend (%)"],
    "Long Term (1 Year)": crop["Long Term Trend (%)"],
  }));

  const volatilityData = cropData.map((crop) => ({
    name: crop.Crop,
    "Price Volatility (%)": crop["Price Volatility (%)"],
    "YoY Change (%)": crop["YoY Change (%)"],
  }));

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
  };

  const getCropRecommendation = (cropName) => {
    const recommendation = recommendations.find(rec => rec.includes(cropName));
    return recommendation || "No specific recommendation available.";
  };

  const getCropAnalysisText = (cropName) => {
    const analysis = cropAnalysis.find(a => a.includes(`CROP ANALYSIS: ${cropName}`));
    return analysis || "No detailed analysis available.";
  };

  const renderTrendIndicator = (value) => {
    if (value > 10) return <span className="text-green-600">↑↑</span>;
    if (value > 0) return <span className="text-green-500">↑</span>;
    if (value > -10) return <span className="text-yellow-600">↓</span>;
    return <span className="text-red-600">↓↓</span>;
  };

  const renderMarketMetrics = () => {
    switch (activeMetricTab) {
      case "trends":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Best Price Trend</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.bestTrend?.Crop}</p>
                  <p className="text-sm">Current: ₹{marketMetrics.bestTrend?.["Current Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-bold">+{marketMetrics.bestTrend?.["Long Term Trend (%)"].toFixed(1)}%</p>
                  <p className="text-sm">1-year forecast</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>Sowing: {marketMetrics.bestTrend?.["Sowing Month"]} • Harvest: {marketMetrics.bestTrend?.["Harvest Month"]}</p>
                <p>Growth Duration: {marketMetrics.bestTrend?.["Growth Duration (Months)"]} month(s)</p>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Worst Price Trend</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.worstTrend?.Crop}</p>
                  <p className="text-sm">Current: ₹{marketMetrics.worstTrend?.["Current Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">{marketMetrics.worstTrend?.["Long Term Trend (%)"].toFixed(1)}%</p>
                  <p className="text-sm">1-year forecast</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>Sowing: {marketMetrics.worstTrend?.["Sowing Month"]} • Harvest: {marketMetrics.worstTrend?.["Harvest Month"]}</p>
                <p>Growth Duration: {marketMetrics.worstTrend?.["Growth Duration (Months)"]} month(s)</p>
              </div>
            </div>
          </div>
        );
      case "volatility":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Least Volatile Crop</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.leastVolatile?.Crop}</p>
                  <p className="text-sm">Current: ₹{marketMetrics.leastVolatile?.["Current Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-600 font-bold">{marketMetrics.leastVolatile?.["Price Volatility (%)"].toFixed(1)}%</p>
                  <p className="text-sm">price volatility</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>Price Range: ₹{marketMetrics.leastVolatile?.["Min Price"].toLocaleString()} - ₹{marketMetrics.leastVolatile?.["Max Price"].toLocaleString()}</p>
                <p>YoY Change: {marketMetrics.leastVolatile?.["YoY Change (%)"].toFixed(2)}%</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Most Volatile Crop</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.mostVolatile?.Crop}</p>
                  <p className="text-sm">Current: ₹{marketMetrics.mostVolatile?.["Current Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-600 font-bold">{marketMetrics.mostVolatile?.["Price Volatility (%)"].toFixed(1)}%</p>
                  <p className="text-sm">price volatility</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>Price Range: ₹{marketMetrics.mostVolatile?.["Min Price"].toLocaleString()} - ₹{marketMetrics.mostVolatile?.["Max Price"].toLocaleString()}</p>
                <p>YoY Change: {marketMetrics.mostVolatile?.["YoY Change (%)"].toFixed(2)}%</p>
              </div>
            </div>
          </div>
        );
      case "prices":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Highest Current Price</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.bestPrice?.Crop}</p>
                  <p className="text-sm">Avg Price: ₹{marketMetrics.bestPrice?.["Avg Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-600 font-bold">₹{marketMetrics.bestPrice?.["Current Price"].toLocaleString()}</p>
                  <p className="text-sm">current price</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>1-Year Forecast: ₹{marketMetrics.bestPrice?.["Forecasted Price (1 Year)"].toLocaleString()} ({marketMetrics.bestPrice?.["Long Term Trend (%)"].toFixed(1)}%)</p>
                <p>YoY Change: {marketMetrics.bestPrice?.["YoY Change (%)"].toFixed(2)}%</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Lowest Current Price</h3>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{marketMetrics.worstPrice?.Crop}</p>
                  <p className="text-sm">Avg Price: ₹{marketMetrics.worstPrice?.["Avg Price"].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 font-bold">₹{marketMetrics.worstPrice?.["Current Price"].toLocaleString()}</p>
                  <p className="text-sm">current price</p>
                </div>
              </div>
              <div className="text-sm mt-2">
                <p>1-Year Forecast: ₹{marketMetrics.worstPrice?.["Forecasted Price (1 Year)"].toLocaleString()} ({marketMetrics.worstPrice?.["Long Term Trend (%)"].toFixed(1)}%)</p>
                <p>YoY Change: {marketMetrics.worstPrice?.["YoY Change (%)"].toFixed(2)}%</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-700">
        Crop Price Analysis & Recommendations
      </h1>
      
      {/* Market Summary */}
      <div className="bg-green-50 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Market Overview</h2>
        <pre className="whitespace-pre-wrap">{overallSummary}</pre>
      </div>

      {/* Market Metrics */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Market Highlights</h2>
        
        <div className="flex border-b mb-4">
          <button 
            className={`py-2 px-4 ${activeMetricTab === 'trends' ? 'border-b-2 border-green-500 font-semibold' : ''}`}
            onClick={() => setActiveMetricTab('trends')}
          >
            Price Trends
          </button>
          <button 
            className={`py-2 px-4 ${activeMetricTab === 'volatility' ? 'border-b-2 border-green-500 font-semibold' : ''}`}
            onClick={() => setActiveMetricTab('volatility')}
          >
            Volatility
          </button>
          <button 
            className={`py-2 px-4 ${activeMetricTab === 'prices' ? 'border-b-2 border-green-500 font-semibold' : ''}`}
            onClick={() => setActiveMetricTab('prices')}
          >
            Current Prices
          </button>
        </div>
        
        {renderMarketMetrics()}
      </div>

      {/* Price Trend Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Price Trend Forecast (%)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={priceChangeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
            <YAxis label={{ value: "Price Change (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="Short Term (1 Month)" fill="#8884d8" />
            <Bar dataKey="Mid Term (6 Months)" fill="#82ca9d" />
            <Bar dataKey="Long Term (1 Year)" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volatility Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Price Volatility & Year-over-Year Change</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={volatilityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
            <YAxis label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="Price Volatility (%)" fill="#ff7300" />
            <Bar dataKey="YoY Change (%)" fill="#00a0fc" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Crop Recommendations Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Crop Analysis & Recommendations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-green-100">
              <tr>
                <th className="py-2 px-4 text-left">Crop</th>
                <th className="py-2 px-4 text-right">Current Price</th>
                <th className="py-2 px-4 text-right">1-Month Forecast</th>
                <th className="py-2 px-4 text-right">6-Month Forecast</th>
                <th className="py-2 px-4 text-right">1-Year Forecast</th>
                <th className="py-2 px-4 text-right">Volatility</th>
                <th className="py-2 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {cropData.map((crop, index) => (
                <tr 
                  key={crop.Crop} 
                  className={index % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-100"}
                  onClick={() => handleCropSelect(crop)}
                >
                  <td className="py-2 px-4 font-medium">{crop.Crop}</td>
                  <td className="py-2 px-4 text-right">₹{crop["Current Price"].toLocaleString()}</td>
                  <td className={`py-2 px-4 text-right ${crop["Short Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{crop["Forecasted Price (Next Month)"].toLocaleString()} 
                    <span className="ml-1">({crop["Short Term Trend (%)"].toFixed(1)}% {renderTrendIndicator(crop["Short Term Trend (%)"])})</span>
                  </td>
                  <td className={`py-2 px-4 text-right ${crop["Mid Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{crop["Forecasted Price (6 Months)"].toLocaleString()}
                    <span className="ml-1">({crop["Mid Term Trend (%)"].toFixed(1)}% {renderTrendIndicator(crop["Mid Term Trend (%)"])})</span>
                  </td>
                  <td className={`py-2 px-4 text-right ${crop["Long Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{crop["Forecasted Price (1 Year)"].toLocaleString()}
                    <span className="ml-1">({crop["Long Term Trend (%)"].toFixed(1)}% {renderTrendIndicator(crop["Long Term Trend (%)"])})</span>
                  </td>
                  <td className="py-2 px-4 text-right">{crop["Price Volatility (%)"].toFixed(1)}%</td>
                  <td className="py-2 px-4 text-center">
                    <button 
                      className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCropSelect(crop);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for crop details */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedCrop.Crop}</h2>
              <button 
                onClick={() => setSelectedCrop(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-lg mb-2">Price Forecast</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">1 Month</p>
                      <p className={`font-bold ${selectedCrop["Short Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedCrop["Short Term Trend (%)"].toFixed(1)}%
                      </p>
                      <p>₹{selectedCrop["Forecasted Price (Next Month)"].toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">6 Months</p>
                      <p className={`font-bold ${selectedCrop["Mid Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedCrop["Mid Term Trend (%)"].toFixed(1)}%
                      </p>
                      <p>₹{selectedCrop["Forecasted Price (6 Months)"].toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">1 Year</p>
                      <p className={`font-bold ${selectedCrop["Long Term Trend (%)"] > 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedCrop["Long Term Trend (%)"].toFixed(1)}%
                      </p>
                      <p>₹{selectedCrop["Forecasted Price (1 Year)"].toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-lg mb-2">Growing Calendar</h3>
                  <p><span className="font-medium">Sowing Month:</span> {selectedCrop["Sowing Month"]}</p>
                  <p><span className="font-medium">Harvest Month:</span> {selectedCrop["Harvest Month"]}</p>
                  <p><span className="font-medium">Growth Duration:</span> {selectedCrop["Growth Duration (Months)"]} months</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-lg mb-2">Price History</h3>
                  <p><span className="font-medium">Current Price:</span> ₹{selectedCrop["Current Price"].toLocaleString()}</p>
                  <p><span className="font-medium">Average Price:</span> ₹{selectedCrop["Avg Price"].toLocaleString()}</p>
                  <p><span className="font-medium">Price Range:</span> ₹{selectedCrop["Min Price"].toLocaleString()} - ₹{selectedCrop["Max Price"].toLocaleString()}</p>
                  <p><span className="font-medium">Year-over-Year Change:</span> {selectedCrop["YoY Change (%)"].toFixed(2)}%</p>
                  <p><span className="font-medium">Price Volatility:</span> {selectedCrop["Price Volatility (%)"].toFixed(2)}%</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded h-64 overflow-y-auto">
                  <h3 className="font-semibold text-lg mb-2">Detailed Analysis</h3>
                  <pre className="whitespace-pre-wrap text-sm">{getCropAnalysisText(selectedCrop.Crop)}</pre>
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold text-lg mb-2">Market Recommendation</h3>
                  <pre className="whitespace-pre-wrap">{getCropRecommendation(selectedCrop.Crop)}</pre>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setSelectedCrop(null)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropRecommendationDashboard;