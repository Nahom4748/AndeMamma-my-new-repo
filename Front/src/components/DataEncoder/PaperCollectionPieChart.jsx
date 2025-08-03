import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { motion } from "framer-motion";

// Vibrant, distinct solid color palette
const COLORS = [
  "#34D399", // Emerald Green
  "#60A5FA", // Blue
  "#FBBF24", // Amber
  "#F87171", // Red
  "#A78BFA", // Purple
  "#10B981", // Darker Green
  "#F472B6", // Pink
  "#38BDF8", // Sky Blue
  "#FB923C", // Orange
  "#4ADE80", // Light Green
];

const PaperCollectionPieChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchPaperData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/collection/reports/papertype");
        const rawData = res.data.data;

        const totalKg = rawData.reduce((sum, item) => sum + parseFloat(item.total_kg), 0);
        const transformed = rawData.map((item) => ({
          name: item.paper_type,
          value: parseFloat(item.total_kg),
          percentage: (parseFloat(item.total_kg) / totalKg) * 100,
          kg: parseFloat(item.total_kg)
        }));

        setChartData(transformed);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching paper data:", err);
        setError("Failed to load paper collection data. Please try again later.");
        setLoading(false);
      }
    };

    fetchPaperData();
  }, []);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
      payload, percent, value
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + (isMobile ? 5 : 10)}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text x={cx} y={cy - (isMobile ? 15 : 20)} textAnchor="middle" fill="#111827" className="font-bold text-xs md:text-sm">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#111827" className="text-xs md:text-sm">
          {`${value.toFixed(1)} kg`}
        </text>
        <text x={cx} y={cy + (isMobile ? 15 : 20)} textAnchor="middle" fill="#111827" className="text-xs md:text-sm">
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping"></div>
            <div className="absolute inset-1 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading paper data...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 p-6 rounded-xl shadow text-center">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h3>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-xl"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-green-600">Paper Collection Summary</h2>
        <p className="text-gray-500 mt-2">Visual breakdown of collected paper types</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="w-full lg:w-2/3">
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                dataKey="kg"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 60 : 80}
                outerRadius={isMobile ? 90 : 120}
                paddingAngle={2}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={800}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [`${value} kg`, `${props.payload.percentage.toFixed(1)}%`]}
                contentStyle={{
                  background: "#1F2937",
                  color: "#F9FAFB",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: isMobile ? "12px" : "14px"
                }}
                itemStyle={{ color: "#F9FAFB", fontSize: isMobile ? "12px" : "14px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 p-4 md:p-6 rounded-xl shadow-inner h-full">
            <h3 className="font-semibold text-lg md:text-xl mb-4 text-gray-800">Distribution Breakdown</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {chartData.map((item, index) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer transition-all"
                  onMouseEnter={() => onPieEnter(null, index)}
                  onMouseLeave={onPieLeave}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-700 font-medium text-sm md:text-base">{item.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-bold mr-2">{item.percentage.toFixed(1)}%</span>
                    <span className="text-gray-500 text-xs">({item.kg.toFixed(1)} kg)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        <p>Hover over chart segments or list items for details</p>
      </div>
    </motion.div>
  );
};

export default PaperCollectionPieChart;
