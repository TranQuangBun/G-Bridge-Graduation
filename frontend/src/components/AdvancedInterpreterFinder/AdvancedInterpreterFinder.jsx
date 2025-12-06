import React, { useState } from "react";
import {
  FaSearch,
  FaArrowRight,
  FaCalendarAlt,
  FaVideo,
  FaMapMarkerAlt,
  FaCertificate,
  FaCheckCircle,
  FaStar,
  FaVolumeUp,
  FaPlay,
  FaDollarSign,
  FaChevronDown,
} from "react-icons/fa";

const AdvancedInterpreterFinder = () => {
  const [sourceLanguage, setSourceLanguage] = useState({
    code: "EN",
    flag: "🇺🇸",
    name: "English",
  });
  const [targetLanguage, setTargetLanguage] = useState({
    code: "VI",
    flag: "🇻🇳",
    name: "Vietnamese",
  });
  const [specialization, setSpecialization] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  const quickFilters = [
    { id: "video", label: "Video Call", icon: FaVideo },
    { id: "onsite", label: "On-site", icon: FaMapMarkerAlt },
    { id: "sworn", label: "Sworn Interpreter", icon: FaCertificate },
    { id: "verified", label: "Verified Badge", icon: FaCheckCircle },
    { id: "fivestar", label: "5-Star Only", icon: FaStar },
  ];

  const specializations = [
    "Medical",
    "Legal",
    "Business",
    "Technical",
    "Conference",
    "Education",
    "Tourism",
  ];

  const mockInterpreters = [
    {
      id: 1,
      name: "Sarah Anderson",
      avatar: "https://i.pravatar.cc/150?img=1",
      rating: 5.0,
      reviews: 127,
      hourlyRate: 45,
      isOnline: true,
      badges: ["IELTS 8.5", "Medical Certified", "TEDx Speaker"],
      languages: ["English", "Vietnamese"],
      experience: "8+ years",
      completedJobs: 234,
    },
    {
      id: 2,
      name: "Takeshi Yamamoto",
      avatar: "https://i.pravatar.cc/150?img=12",
      rating: 4.9,
      reviews: 93,
      hourlyRate: 55,
      isOnline: false,
      badges: ["JLPT N1", "Legal Expert", "Court Certified"],
      languages: ["Japanese", "Vietnamese"],
      experience: "10+ years",
      completedJobs: 312,
    },
    {
      id: 3,
      name: "Marie Dubois",
      avatar: "https://i.pravatar.cc/150?img=5",
      rating: 4.8,
      reviews: 156,
      hourlyRate: 50,
      isOnline: true,
      badges: ["DELF C2", "Business Pro", "UN Experience"],
      languages: ["French", "Vietnamese"],
      experience: "12+ years",
      completedJobs: 445,
    },
  ];

  const toggleFilter = (filterId) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`${
              i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
            } text-sm`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Search */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pt-20 pb-32">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Find Your Perfect Interpreter
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Connect with verified language professionals. Book with
              confidence.
            </p>
          </div>

          {/* Advanced Search Bar */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-full shadow-2xl p-3 flex items-center gap-2 flex-wrap lg:flex-nowrap">
              {/* Language Pair Section */}
              <div className="flex items-center gap-2 flex-1 min-w-[250px] px-4 py-3 hover:bg-gray-50 rounded-full transition-colors cursor-pointer border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{sourceLanguage.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">
                      From
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {sourceLanguage.name}
                    </span>
                  </div>
                </div>
                <FaArrowRight className="text-blue-500 mx-2" />
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{targetLanguage.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">
                      To
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {targetLanguage.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialization Section */}
              <div className="flex-1 min-w-[180px] px-4 py-3 hover:bg-gray-50 rounded-full transition-colors cursor-pointer border-r border-gray-200 relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 font-medium">
                      Topic
                    </span>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6"
                    >
                      <option value="">All Topics</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FaChevronDown className="text-gray-400 text-xs absolute right-6" />
                </div>
              </div>

              {/* Date Section */}
              <div className="flex-1 min-w-[150px] px-4 py-3 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-500" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 font-medium">
                      Date
                    </span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 whitespace-nowrap">
                <FaSearch />
                <span>Find Interpreters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-12">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap mr-2">
              Quick Filters:
            </span>
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="text-sm" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Top Rated Interpreters
          </h2>
          <p className="text-gray-600">
            {mockInterpreters.length} professionals available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockInterpreters.map((interpreter) => (
            <div
              key={interpreter.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1"
            >
              {/* Card Header with Avatar */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 pb-20">
                <div className="absolute top-4 right-4">
                  {interpreter.isOnline && (
                    <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Online
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={interpreter.avatar}
                      alt={interpreter.name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                    />
                    {interpreter.isOnline && (
                      <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 -mt-12 relative">
                <div className="bg-white rounded-xl shadow-md p-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {interpreter.name}
                  </h3>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    {renderStars(interpreter.rating)}
                    <span className="text-sm font-semibold text-gray-700">
                      {interpreter.rating}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({interpreter.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <FaDollarSign className="text-green-600" />
                    <span className="text-3xl font-bold text-gray-900">
                      ${interpreter.hourlyRate}
                    </span>
                    <span className="text-sm text-gray-500">/hour</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {interpreter.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Experience</div>
                    <div className="font-semibold text-gray-900">
                      {interpreter.experience}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Completed</div>
                    <div className="font-semibold text-gray-900">
                      {interpreter.completedJobs} jobs
                    </div>
                  </div>
                </div>

                {/* Voice Sample Button */}
                <button className="w-full bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mb-3 group">
                  <FaVolumeUp className="group-hover:scale-110 transition-transform" />
                  <span>Listen to Voice Sample</span>
                  <FaPlay className="text-xs" />
                </button>

                {/* Book Now Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedInterpreterFinder;
