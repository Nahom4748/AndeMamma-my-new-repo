import React, { useEffect, useState } from "react";
import { 
  Card, 
  Button, 
  Select, 
  message, 
  Tag, 
  Avatar, 
  Badge, 
  Divider, 
  Popconfirm, 
  Input,
  Space,
  Typography,
  Tabs,
  Grid,
  ConfigProvider
} from "antd";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  ShopOutlined,
  HomeOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;  // Properly destructured from Input
const { useBreakpoint } = Grid;

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AnimatedCard = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay * 0.1 }}
  >
    {children}
  </motion.div>
);

const SupplierBadge = ({ supplier, type, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
    className="mb-2"
  >
    <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-xs hover:shadow-sm border border-gray-100 group transition-all">
      <div className="flex items-center truncate">
        <Avatar 
          size="small" 
          src={`https://ui-avatars.com/api/?name=${supplier.company_name}&background=${type === 1 ? '10b981' : '3b82f6'}&color=fff`}
          className="mr-2 flex-shrink-0"
        />
        <div className="truncate">
          <div className="font-medium text-gray-800 truncate">{supplier.company_name}</div>
          <Tag 
            color={type === 1 ? 'green' : 'blue'} 
            icon={type === 1 ? <ShopOutlined className="text-xs" /> : <HomeOutlined className="text-xs" />}
            className="rounded-full text-xs border-0 px-2 h-5"
          >
            {type === 1 ? 'In-store' : 'Regular'}
          </Tag>
        </div>
      </div>
      <Popconfirm
        title="Remove this supplier?"
        onConfirm={onRemove}
        okText="Yes"
        cancelText="No"
        placement="left"
      >
        <Button 
          type="text" 
          shape="circle" 
          icon={<DeleteOutlined className="text-xs text-gray-400 group-hover:text-red-500 transition-colors" />} 
          size="small"
          className="opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      </Popconfirm>
    </div>
  </motion.div>
);

const groupPlansByDay = (plans) => {
  return plans.reduce((acc, item) => {
    const date = moment(item.plan_date).format("YYYY-MM-DD");
    if (!acc[date]) acc[date] = [];
    acc[date].push({
      supplierId: item.supplier_id,
      collectionTypeId: item.collection_type_id,
      supplier: item.supplier
    });
    return acc;
  }, {});
};

const WeeklyPlan = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("0");
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("week").add(1, "day"));
  const screens = useBreakpoint();

  useEffect(() => {
    fetchSuppliers();
    fetchCurrentWeekPlan();
  }, [currentWeekStart]);

  const fetchSuppliers = async () => {
    try {
      setFetching(true);
      const res = await axios.get("http://localhost:5000/suppliers");
      setSuppliers(res.data.data);
    } catch (err) {
      message.error("Failed to load suppliers");
    } finally {
      setFetching(false);
    }
  };

  const fetchCurrentWeekPlan = async () => {
    try {
      const startDate = currentWeekStart.format("YYYY-MM-DD");
      const endDate = currentWeekStart.clone().add(5, 'days').format("YYYY-MM-DD");
      
      const { data } = await axios.get(
        `http://localhost:5000/api/weekly-plan?start_date=${startDate}&end_date=${endDate}`
      );

      const grouped = groupPlansByDay(data.data || []);
      setWeeklyPlan(grouped);
    } catch (err) {
      console.error("Failed to load current week plan", err);
      message.error("Failed to load week plan data");
    }
  };

  const getWeekDates = () => {
    return daysOfWeek.map((_, idx) => currentWeekStart.clone().add(idx, "days"));
  };

  const handleAddSupplier = (date, supplierId, collectionTypeId) => {
    const dateStr = date.format("YYYY-MM-DD");
    const supplier = suppliers.find(s => s.id === supplierId);
    
    setWeeklyPlan((prev) => {
      const updated = { ...prev };
      if (!updated[dateStr]) updated[dateStr] = [];
      updated[dateStr].push({ 
        supplierId, 
        collectionTypeId,
        supplier
      });
      return updated;
    });
  };

  const handleRemoveSupplier = (dateStr, index) => {
    setWeeklyPlan((prev) => {
      const updated = { ...prev };
      updated[dateStr] = updated[dateStr].filter((_, i) => i !== index);
      if (updated[dateStr].length === 0) delete updated[dateStr];
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const plans = Object.entries(weeklyPlan).flatMap(([date, items]) =>
        items.map(({ supplierId, collectionTypeId }) => ({
          plan_date: date,
          supplier_id: supplierId,
          collection_type_id: collectionTypeId,
        }))
      );
    
      await axios.post("http://localhost:5000/api/weekly-plan", { plans, createdBy: 1 });
      message.success({
        content: (
          <div className="flex items-center">
            <CheckCircleOutlined className="text-green-500 text-lg mr-2" />
            <span>Weekly plan submitted successfully!</span>
          </div>
        ),
        duration: 3,
      });
      
      await fetchCurrentWeekPlan();
    } catch (err) {
      message.error("Failed to submit weekly plan");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const weekDates = getWeekDates();

  const handleWeekChange = (direction) => {
    setCurrentWeekStart(prev => prev.clone().add(direction * 7, 'days'));
    setActiveTab("0");
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10b981',
          borderRadius: 8,
        },
      }}
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 md:mb-6"
        >
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
                <CalendarOutlined className="mr-2 text-green-500" />
                Weekly Collection Plan
              </h1>
              <Text type="secondary" className="text-xs md:text-sm">
                {weekDates[0].format("MMM D")} - {weekDates[weekDates.length - 1].format("MMM D, YYYY")}
              </Text>
            </div>
            
            {/* Mobile Week Navigation */}
            {!screens.md && (
              <div className="flex items-center justify-between mb-2">
                <Button 
                  size="small" 
                  icon={<LeftOutlined />} 
                  onClick={() => handleWeekChange(-1)}
                />
                <Text className="text-sm font-medium">
                  {weekDates[0].format("MMM D")} - {weekDates[weekDates.length - 1].format("D")}
                </Text>
                <Button 
                  size="small" 
                  icon={<RightOutlined />} 
                  onClick={() => handleWeekChange(1)}
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2">
              <Search
                placeholder="Search suppliers..."
                allowClear
                size={screens.md ? "middle" : "small"}
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button 
                type="primary" 
                onClick={handleSubmit} 
                loading={loading}
                icon={<CheckCircleOutlined />}
                size={screens.md ? "middle" : "small"}
                className="w-full md:w-auto shadow-xs bg-green-500 hover:bg-green-600 border-green-500"
              >
                {screens.sm ? "Submit Plan" : "Submit"}
              </Button>
            </div>
          </div>

          {/* Desktop Week Navigation */}
          {screens.md && (
            <div className="flex items-center justify-between mb-2">
              <Button 
                onClick={() => handleWeekChange(-1)}
                icon={<LeftOutlined />}
              >
                Previous Week
              </Button>
              <div className="text-base font-medium">
                Week of {weekDates[0].format("MMMM D")}
              </div>
              <Button 
                onClick={() => handleWeekChange(1)}
                icon={<RightOutlined />}
              >
                Next Week
              </Button>
            </div>
          )}

          <Divider className="my-1 md:my-2 bg-green-50" />
        </motion.div>

        {/* Days Tabs */}
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          type={screens.md ? "card" : "line"}
          tabBarGutter={screens.md ? 0 : 8}
          className="weekly-plan-tabs"
        >
          {weekDates.map((date, idx) => {
            const dateStr = date.format("YYYY-MM-DD");
            const dayPlans = weeklyPlan[dateStr] || [];
            const hasPlans = dayPlans.length > 0;
            
            return (
              <TabPane 
                tab={
                  <div className="flex items-center px-1">
                    <span className="text-xs md:text-sm">{daysOfWeek[idx]}</span>
                    <span className="ml-1 text-xs text-gray-500 hidden md:inline">
                      {date.format("D")}
                    </span>
                    {hasPlans && (
                      <Badge 
                        count={dayPlans.length} 
                        style={{ 
                          backgroundColor: '#10b981',
                          marginLeft: 4,
                          fontSize: '10px',
                          height: '16px',
                          lineHeight: '16px',
                          minWidth: '16px'
                        }} 
                      />
                    )}
                  </div>
                } 
                key={idx.toString()}
              >
                <AnimatedCard delay={idx}>
                  <Card
                    className="shadow-xs border-gray-100"
                    bodyStyle={{ padding: screens.md ? '16px' : '12px' }}
                  >
                    <div className="mb-3">
                      <Select
                        placeholder={
                          <div className="flex items-center text-gray-400 text-xs md:text-sm">
                            <PlusOutlined className="mr-1 md:mr-2" />
                            Add supplier
                          </div>
                        }
                        style={{ width: "100%" }}
                        size={screens.md ? "middle" : "small"}
                        loading={fetching}
                        dropdownMatchSelectWidth={false}
                        onChange={(value) => {
                          const [supplierId, collectionTypeId] = value.split("-").map(Number);
                          handleAddSupplier(date, supplierId, collectionTypeId);
                        }}
                        optionLabelProp="label"
                        dropdownRender={menu => (
                          <>
                            <div className="p-2">
                              <Input
                                placeholder="Search suppliers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                prefix={<SearchOutlined />}
                                allowClear
                                size="small"
                              />
                            </div>
                            <Divider className="my-1" />
                            {menu}
                          </>
                        )}
                      >
                        {filteredSuppliers.map((supplier) => [
                          <Option 
                            key={`${supplier.id}-1`} 
                            value={`${supplier.id}-1`}
                            label={
                              <div className="flex items-center truncate">
                                <span className="truncate text-xs md:text-sm">{supplier.company_name}</span>
                                <Tag color="green" className="ml-1 md:ml-2 text-xs">In-store</Tag>
                              </div>
                            }
                          >
                            <div className="flex items-center justify-between text-xs md:text-sm">
                              <span className="truncate">{supplier.company_name}</span>
                              <Tag color="green" className="text-xs">In-store</Tag>
                            </div>
                          </Option>,
                          <Option 
                            key={`${supplier.id}-2`} 
                            value={`${supplier.id}-2`}
                            label={
                              <div className="flex items-center truncate">
                                <span className="truncate text-xs md:text-sm">{supplier.company_name}</span>
                                <Tag color="blue" className="ml-1 md:ml-2 text-xs">Regular</Tag>
                              </div>
                            }
                          >
                            <div className="flex items-center justify-between text-xs md:text-sm">
                              <span className="truncate">{supplier.company_name}</span>
                              <Tag color="blue" className="text-xs">Regular</Tag>
                            </div>
                          </Option>
                        ])}
                      </Select>
                    </div>

                    {dayPlans.length > 0 ? (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
                      >
                        {dayPlans.map((entry, i) => {
                          const supplier = entry.supplier || suppliers.find((s) => s.id === entry.supplierId);
                          return supplier ? (
                            <motion.div
                              key={`${dateStr}-${i}`}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                            >
                              <SupplierBadge 
                                supplier={supplier} 
                                type={entry.collectionTypeId} 
                                onRemove={() => handleRemoveSupplier(dateStr, i)}
                              />
                            </motion.div>
                          ) : null;
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-4 md:py-8 text-gray-400 text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 md:h-12 md:w-12 mb-1 md:mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="text-xs md:text-sm">No suppliers added yet</p>
                        <p className="text-xs text-gray-400">Add suppliers to create your plan</p>
                      </motion.div>
                    )}
                  </Card>
                </AnimatedCard>
              </TabPane>
            );
          })}
        </Tabs>
      </div>

      <style jsx global>{`
        .weekly-plan-tabs .ant-tabs-nav {
          margin-bottom: 12px;
        }
        .weekly-plan-tabs .ant-tabs-tab {
          padding: 8px 12px !important;
          margin: 0 2px !important;
        }
        .weekly-plan-tabs .ant-tabs-tab-active {
          background: #f0fdf4 !important;
        }
        @media (max-width: 768px) {
          .weekly-plan-tabs .ant-tabs-nav {
            margin-bottom: 8px;
          }
          .weekly-plan-tabs .ant-tabs-tab {
            padding: 4px 8px !important;
            margin: 0 1px !important;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default WeeklyPlan;