import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Calendar,
  AlertTriangle,
  Info,
  Wind,
  MapPin,
  CheckCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

/**
 * WEATHER TREND PLANNER
 * Implementation based on Test Requirements PDF
 */

const App = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Note: For production, use environment variables. 
  // This key is for demonstration purposes based on the OpenWeather API requirement.
  const API_KEY = "1f9c0b9fa34fec77da69b7ab2bccb7d9"; 

  /**
   * REQUIREMENT 8: DATA TRANSFORMATION
   * Converts 3-hour forecast intervals into daily averages.
   */
  const processForecast = (data) => {
    const dailyTemps = {};
    const dailyMetadata = {}; // To store conditions/icons for display

    data.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0]; // Extract YYYY-MM-DD
      
      if (!dailyTemps[date]) {
        dailyTemps[date] = [];
        dailyMetadata[date] = {
          conditions: [],
          icons: []
        };
      }
      
      dailyTemps[date].push(item.main.temp);
      dailyMetadata[date].conditions.push(item.weather[0].main);
      dailyMetadata[date].icons.push(item.weather[0].icon);
    });

    const result = Object.keys(dailyTemps).map(date => {
      const temps = dailyTemps[date];
      
      // PDF Calculation: temps.reduce((a, b) => a + b) / temps.length
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      
      // Determine most frequent condition for that day
      const conditionCounts = dailyMetadata[date].conditions.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      const topCondition = Object.keys(conditionCounts).reduce((a, b) => conditionCounts[a] > conditionCounts[b] ? a : b);

      return { 
        date, 
        displayDate: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp: Math.round(avgTemp * 10) / 10,
        condition: topCondition,
        icon: dailyMetadata[date].icons[Math.floor(dailyMetadata[date].icons.length / 2)] // Middle of the day icon
      };
    });

    return result;
  };

  /**
   * REQUIREMENT 9.1: SEARCH WEATHER
   */
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 2.1 Example API Request structure
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(response.status === 404 ? "City not found. Please check spelling." : "Failed to fetch weather data.");
      }

      const data = await response.json();
      const processedDays = processForecast(data);
      
      setWeatherData({
        city: data.city.name,
        country: data.city.country,
        days: processedDays
      });
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * REQUIREMENT 9.4: GET ACTIVITY RECOMMENDATION
   * Suggests the "Best Day" based on mild temps and lack of rain.
   */
  const getRecommendation = () => {
    if (!weatherData) return null;
    
    // Simple algorithm: Best day is the one with no rain and closest to 22°C
    const scores = weatherData.days.map(day => {
      let score = 100;
      if (day.condition.toLowerCase().includes('rain')) score -= 50;
      if (day.condition.toLowerCase().includes('snow')) score -= 60;
      score -= Math.abs(day.temp - 22); // Distance from "perfect" 22 degrees
      return { ...day, score };
    });

    return scores.sort((a, b) => b.score - a.score)[0];
  };

  const bestDay = getRecommendation();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Requirement 3: City Input Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
              <Cloud className="text-blue-500 w-10 h-10" />
              Weather Trend Planner
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Analyze trends & plan activities</p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-auto shadow-sm">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Enter city (e.g. London)"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-l-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-r-2xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {weatherData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 9.2: VIEW CURRENT WEATHER (Left Panel) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-slate-400 mb-2 font-bold uppercase tracking-widest text-xs">
                  <MapPin size={14} />
                  Current Focus
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-6">{weatherData.city}, {weatherData.country}</h2>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 blur-3xl opacity-30 rounded-full"></div>
                  <img 
                    src={`https://openweathermap.org/img/wn/${weatherData.days[0].icon}@4x.png`} 
                    alt="Weather"
                    className="relative w-48 h-48 drop-shadow-2xl"
                  />
                </div>

                <div className="text-7xl font-black text-slate-800 flex items-start mt-4">
                  {weatherData.days[0].temp}<span className="text-3xl text-blue-500 mt-2">°C</span>
                </div>
                <p className="text-xl font-bold text-slate-500 capitalize mt-2 tracking-wide">
                  {weatherData.days[0].condition}
                </p>

                <div className="grid grid-cols-2 w-full gap-4 mt-8 pt-8 border-t border-slate-50">
                  <div className="text-left bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                    <p className="font-bold text-slate-700">{weatherData.days[0].displayDate}</p>
                  </div>
                  <div className="text-left bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold uppercase">Source</p>
                    <p className="font-bold text-slate-700">OpenWeather</p>
                  </div>
                </div>
              </div>

              {/* 9.4: GET ACTIVITY RECOMMENDATION (Highlight) */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-lg shadow-blue-200">
                <div className="flex items-center gap-2 mb-4 opacity-80 uppercase tracking-tighter font-black text-sm">
                  <CheckCircle size={18} />
                  Insight Generation
                </div>
                <h3 className="text-2xl font-black mb-4">Best Activity Day</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  We analyzed the trends. <strong>{bestDay.displayDate}</strong> is your ideal window for outdoor plans with an average of {bestDay.temp}°C and {bestDay.condition.toLowerCase()} skies.
                </p>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="block text-xs font-bold uppercase opacity-70">Suggested</span>
                    <span className="text-lg font-bold">{bestDay.displayDate}</span>
                  </div>
                  <Thermometer className="text-white" size={32} />
                </div>
              </div>
            </div>

            {/* 9.3 & 9.5: VIEW WEATHER TREND (Right Panel) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Line Chart Section */}
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Wind className="text-blue-500" size={24} />
                    Temperature Trend
                  </h3>
                  <div className="flex gap-2">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Next 5-6 Days</span>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weatherData.days}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}}
                        unit="°"
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                        cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="temp" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#tempGradient)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Extended Forecast List (Visualizing Daily Averages) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {weatherData.days.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-3xl border transition-all duration-300 ${
                      day.date === bestDay.date 
                      ? 'bg-white border-blue-500 ring-4 ring-blue-500/10' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">{day.displayDate}</p>
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                      alt="Condition"
                      className="w-12 h-12 mx-auto mb-2"
                    />
                    <div className="text-2xl font-black text-slate-800">{day.temp}°</div>
                    <p className="text-[10px] font-bold text-slate-500 truncate mt-1 uppercase">{day.condition}</p>
                  </div>
                ))}
              </div>

              {/* Requirements Warning (9.5 logic) */}
              {weatherData.days.some(d => d.condition.toLowerCase().includes('rain')) && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                    <Info size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-800 uppercase text-sm tracking-widest mb-1">Weather Advisory</h4>
                    <p className="text-amber-700 text-sm font-medium">Precipitation detected in the forecast. Outdoor activities might be disrupted on rainy days.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-slate-200 mb-8 border border-slate-50">
              <Sun className="text-blue-500 w-16 h-16 animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Ready to plan?</h2>
            <p className="text-slate-500 mt-2 max-w-sm">Enter a city name above to view current weather, trends, and our top activity picks.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
};

export default App;