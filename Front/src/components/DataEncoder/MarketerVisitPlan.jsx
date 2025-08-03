import React, { useEffect, useState } from "react";
import {
  Button,
  Select,
  Input,
  message,
  Typography,
  Tabs,
  Space,
  Avatar,
  Drawer,
  Form,
  Badge,
  Popover,
  Divider,
  ConfigProvider,
  Tag,
  Modal,
  DatePicker
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  SearchOutlined,
  CloseOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  FieldTimeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";

const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { confirm } = Modal;

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const visitTypes = [
  { value: 'sourcing', label: 'Sourcing', color: 'bg-emerald-500', icon: '🛒' },
  { value: 'product', label: 'Product', color: 'bg-blue-500', icon: '📦' },
  { value: 'strategic', label: 'Strategic', color: 'bg-indigo-500', icon: '📊' },
  { value: 'followup', label: 'Follow-up', color: 'bg-amber-500', icon: '🔄' },
];

const MarketerVisitPlan = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [visitPlans, setVisitPlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    moment().startOf('week')
  );
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(
    moment().day() === 0 ? "6" : moment().day().toString()
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form] = Form.useForm()

  useEffect(() => {
    fetchSuppliers();
    fetchExistingPlans();
  }, [currentWeekStart]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/suppliers");
      setSuppliers(res.data.data);
    } catch (err) {
      message.error("Failed to load suppliers");
    }
  };

  const fetchExistingPlans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/marketer-visits", {
        params: {
          start_date: currentWeekStart.format("YYYY-MM-DD"),
          end_date: currentWeekStart.clone().add(6, 'days').format("YYYY-MM-DD")
        }
      });
      
      const plans = {};
      res.data.data.forEach(plan => {
        const dateStr = moment(plan.visit_date).format("YYYY-MM-DD");
        if (!plans[dateStr]) {
          plans[dateStr] = [];
        }
        plans[dateStr].push({
          supplierId: plan.supplier_id,
          type: plan.type,
          notes: plan.details,
          id: plan.id,
          status: plan.status,
          feedback: plan.feedback
        });
      });
      setVisitPlans(plans);
    } catch (err) {
      console.error("Failed to load existing plans:", err);
    }
  };

  const getWeekDates = () => {
    return daysOfWeek.map((_, i) => currentWeekStart.clone().add(i, "days"));
  };

  const showDrawer = (date) => {
    if (date.isBefore(moment().startOf('day'))) {
      message.warning("Cannot plan visits for past dates");
      return;
    }
    setSelectedDate(date);
    form.resetFields();
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  const handleAddVisit = async (values) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    const newPlan = { 
      supplierId: values.supplier, 
      type: values.type,
      notes: values.notes,
      id: Date.now(),
      status: 'Pending',
      feedback: null
    };
    
    try {
      // Save to database immediately
      const response = await axios.post("http://localhost:5000/api/marketer-visits", {
        visit_date: dateStr,
        supplier_id: values.supplier,
        type: values.type,
        details: values.notes,
        marketer_id: 2,
        status: 'Pending'
      });

      // Update local state with the database ID
      setVisitPlans(prev => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), {
          ...newPlan,
          id: response.data.id
        }]
      }));
      
      message.success('Visit added successfully!');
      onClose();
    } catch (err) {
      message.error('Failed to save visit');
      console.error('Error saving visit:', err);
    }
  };

  const showDeleteConfirm = (dateStr, visitId) => {
    confirm({
      title: 'Are you sure you want to delete this visit?',
      icon: <ExclamationCircleFilled />,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No, cancel',
      onOk() {
        handleRemoveVisit(dateStr, visitId);
      },
    });
  };

  const handleRemoveVisit = async (dateStr, visitId) => {
    try {
      await axios.delete(`http://localhost:5000/api/marketer-visits/${visitId}`);
      setVisitPlans(prev => {
        const updatedPlans = { ...prev };
        updatedPlans[dateStr] = updatedPlans[dateStr].filter(v => v.id !== visitId);
        return updatedPlans;
      });
      message.success('Visit deleted successfully');
    } catch (err) {
      message.error('Failed to delete visit');
      console.error('Error deleting visit:', err);
    }
  };

  const handleStatusChange = async (dateStr, visitId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/marketer-visits/${visitId}`, {
        status: newStatus
      });
      setVisitPlans(prev => {
        const updatedPlans = { ...prev };
        updatedPlans[dateStr] = updatedPlans[dateStr].map(v => 
          v.id === visitId ? { ...v, status: newStatus } : v
        );
        return updatedPlans;
      });
      message.success(`Status updated to ${newStatus}`);
    } catch (err) {
      message.error('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const handleWeekChange = (dir) => {
    const newWeek = currentWeekStart.clone().add(dir * 7, "days");
    if (newWeek.isSameOrAfter(moment().startOf('week'), 'day')) {
      setCurrentWeekStart(newWeek);
      setActiveTab(moment().day().toString());
    } else {
      message.warning("You can only plan for current or future weeks");
    }
  };

  const weekDates = getWeekDates();
  const filteredSuppliers = suppliers
    .filter(s => s.company_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.company_name.localeCompare(b.company_name));

  const getStatusTag = (status) => {
    const statusMap = {
      'Pending': { color: 'blue', icon: <FieldTimeOutlined /> },
      'Completed': { color: 'green', icon: <CheckCircleOutlined /> },
      'Cancelled': { color: 'red', icon: <CloseOutlined /> },
      'Rescheduled': { color: 'orange', icon: <SyncOutlined /> },
      'Follow-up': { color: 'purple', icon: <FileTextOutlined /> }
    };
    
    const config = statusMap[status] || statusMap['Pending'];
    
    return (
      <Tag 
        icon={config.icon} 
        color={config.color}
        className="flex items-center px-2 py-0.5 rounded-full text-xs"
      >
        {status}
      </Tag>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10b981',
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <div className="p-4 md:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="mb-6 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center mb-1">
                <GlobalOutlined className="text-emerald-500 text-lg mr-2" />
                <Text className="text-xs md:text-sm text-gray-500 uppercase tracking-wider font-medium">
                  Supplier Visit Planner
                </Text>
              </div>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-xl mr-3">
                  <CalendarOutlined className="text-white text-lg" />
                </div>
                <div>
                  <Title level={3} className="m-0 text-gray-800 font-semibold">Weekly Schedule</Title>
                  <Text className="text-xs md:text-sm text-gray-500">
                    {weekDates[0].format("MMM D")} - {weekDates[6].format("MMM D, YYYY")}
                  </Text>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Popover content="Search suppliers by name">
                <Input
                  placeholder="Search suppliers..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  className="w-full sm:w-48 md:w-56 rounded-lg h-10 text-sm"
                />
              </Popover>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4 md:mt-6 bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-100">
            <Button 
              onClick={() => handleWeekChange(-1)}
              disabled={currentWeekStart.isSame(moment().startOf('week'), 'week')}
              className="flex items-center rounded-lg h-9 text-xs sm:text-sm"
              icon={<ArrowLeftOutlined className="text-xs" />}
            >
              <span className="hidden xs:inline">Previous</span>
            </Button>
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
              Week of {weekDates[0].format("MMMM D")}
            </Text>
            <Button 
              onClick={() => handleWeekChange(1)}
              className="flex items-center rounded-lg h-9 text-xs sm:text-sm"
              icon={<ArrowRightOutlined className="text-xs" />}
            >
              <span className="hidden xs:inline">Next</span>
            </Button>
          </div>
        </div>

        {/* Days Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            type="line"
            size="middle"
            tabBarStyle={{ 
              marginBottom: 0,
              backgroundColor: 'white',
              padding: '0 16px',
            }}
            className="custom-tabs"
          >
            {weekDates.map((date, idx) => {
              const dateStr = date.format("YYYY-MM-DD");
              const plans = visitPlans[dateStr] || [];
              const isToday = date.isSame(moment(), 'day');
              const isPast = date.isBefore(moment(), 'day') && !isToday;

              return (
                <TabPane
                  key={idx.toString()}
                  tab={
                    <div className={`flex flex-col items-center px-1 ${isToday ? 'font-semibold' : ''}`}>
                      <div className={`text-[10px] sm:text-xs ${isToday ? 'text-emerald-600' : isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                        {daysOfWeek[idx]}
                      </div>
                      <Badge 
                        count={plans.length} 
                        size="small" 
                        offset={[4, -4]}
                        className={`${isPast ? 'bg-gray-200 text-gray-500' : 'bg-emerald-500 text-white'}`}
                      >
                        <div className={`text-xs sm:text-sm ${isToday ? 'text-emerald-600 font-semibold' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                          {date.format("D")}
                        </div>
                      </Badge>
                    </div>
                  }
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4"
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => showDrawer(date)}
                      block
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 h-12 rounded-lg shadow-sm mb-4 text-sm"
                      disabled={isPast}
                    >
                      <span className="font-medium">Add Supplier Visit</span>
                    </Button>

                    {plans.length > 0 ? (
                      <div className="space-y-3">
                        {plans.map((entry) => {
                          const supplier = suppliers.find(s => s.id === entry.supplierId);
                          const visitType = visitTypes.find(t => t.value === entry.type);
                          const isEditable = !moment(dateStr).isBefore(moment().startOf('day'));
                          
                          return (
                            <div 
                              key={entry.id}
                              className={`p-3 sm:p-4 rounded-xl border ${isPast ? 'border-gray-200' : 'border-gray-200 hover:border-emerald-100'} transition-colors ${isPast ? 'opacity-75 bg-gray-50' : 'bg-white'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {getStatusTag(entry.status)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-800 truncate text-sm sm:text-base">
                                      {supplier?.company_name}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      {visitType && (
                                        <Tag
                                          className={`${visitType.color} text-white text-xs py-0.5 px-2 border-0`}
                                        >
                                          <span className="mr-1">{visitType.icon}</span>
                                          {visitType.label}
                                        </Tag>
                                      )}
                                    </div>
                                    {supplier?.location && (
                                      <div className="flex items-center mt-1.5 text-[11px] sm:text-xs text-gray-500">
                                        <EnvironmentOutlined className="mr-1 text-[10px]" />
                                        {supplier.location}
                                      </div>
                                    )}
                                    {entry.notes && (
                                      <div className="mt-2 text-gray-600">
                                        <Text 
                                          className="text-xs line-clamp-2"
                                          ellipsis={{ tooltip: entry.notes }}
                                        >
                                          {entry.notes}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isEditable && (
                                  <div className="flex flex-col items-end">
                                    <Popover
                                      placement="bottomRight"
                                      trigger="click"
                                      content={
                                        <div className="space-y-2 w-40">
                                          {['Pending', 'Completed', 'Cancelled', 'Rescheduled', 'Follow-up'].map(status => (
                                            <div
                                              key={status}
                                              onClick={() => handleStatusChange(dateStr, entry.id, status)}
                                              className={`flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 ${entry.status === status ? 'bg-gray-100' : ''}`}
                                            >
                                              {getStatusTag(status)}
                                            </div>
                                          ))}
                                        </div>
                                      }
                                    >
                                      <Button 
                                        type="text" 
                                        icon={<MoreOutlined />} 
                                        className="text-gray-500 hover:text-blue-500"
                                      />
                                    </Popover>
                                    <button
                                      onClick={() => showDeleteConfirm(dateStr, entry.id)}
                                      className="text-gray-400 hover:text-red-500 mt-2"
                                      aria-label="Delete visit"
                                    >
                                      <DeleteOutlined className="text-xs sm:text-sm" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-300 mb-3">
                          <FileTextOutlined className="text-3xl" />
                        </div>
                        <Text className="text-gray-500 text-sm">
                          {isPast ? "No visits were planned for this day" : "No visits planned yet"}
                        </Text>
                        {!isPast && (
                          <div className="mt-4">
                            <Button 
                              type="primary" 
                              ghost 
                              icon={<PlusOutlined />}
                              onClick={() => showDrawer(date)}
                              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 rounded-lg h-9 text-xs sm:text-sm"
                            >
                              Add First Visit
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </TabPane>
              );
            })}
          </Tabs>
        </div>

        {/* Add Visit Drawer */}
        <Drawer
          title={
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-xl mr-3">
                <CalendarOutlined className="text-white text-lg" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">New Visit</div>
                <div className="text-base font-semibold text-gray-800">
                  {selectedDate?.format("dddd, MMMM D")}
                </div>
              </div>
            </div>
          }
          placement="right"
          width={Math.min(window.innerWidth * 0.9, 450)}
          onClose={onClose}
          open={drawerVisible}
          footer={null}
          closable={false}
          headerStyle={{ 
            borderBottom: '1px solid #f0f0f0',
            padding: '16px 20px',
            background: 'white'
          }}
          bodyStyle={{ padding: '16px 0', background: '#f9fafb' }}
          extra={
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <CloseOutlined className="text-base" />
            </button>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddVisit}
            className="px-4"
          >
            <Form.Item
              label={<span className="font-medium text-gray-700 text-sm">Supplier</span>}
              name="supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                showSearch
                placeholder="Search suppliers..."
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                size="large"
                className="w-full rounded-lg h-11 text-sm"
                dropdownStyle={{ borderRadius: '10px' }}
                notFoundContent={
                  <div className="py-4 text-center text-gray-400 text-sm">
                      No suppliers found
                  </div>
                }
              >
                {filteredSuppliers.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id} className="text-sm">
                    <div className="flex items-center">
                      <Avatar
                        size="small"
                        src={`https://ui-avatars.com/api/?name=${supplier.company_name}&background=10b981&color=fff`}
                        className="mr-2"
                        icon={<UserOutlined />}
                      />
                      <div>
                        <div className="font-medium text-sm">{supplier.company_name}</div>
                        {supplier.location && (
                          <div className="text-xs text-gray-500">{supplier.location}</div>
                        )}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              label={<span className="font-medium text-gray-700 text-sm">Visit Type</span>}
              name="type"
              rules={[{ required: true, message: 'Please select visit type' }]}
            >
              <Select 
                placeholder="Select type" 
                options={visitTypes.map(t => ({
                  ...t,
                  label: (
                    <div className="flex items-center text-sm">
                      <span className="mr-2">{t.icon}</span>
                      {t.label}
                    </div>
                  )
                }))} 
                size="large"
                className="rounded-lg h-11 text-sm"
              />
            </Form.Item>
            
            <Form.Item
              label={<span className="font-medium text-gray-700 text-sm">Notes</span>}
              name="notes"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Enter visit details, objectives, or special instructions"
                maxLength={300}
                showCount
                className="rounded-lg text-sm"
              />
            </Form.Item>
            
            <Divider className="my-4" />
            
            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                htmlType="submit" 
                block
                size="large"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 h-11 rounded-lg shadow-sm text-sm"
              >
                <span className="font-medium">Schedule Visit</span>
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </ConfigProvider>
  );
};

export default MarketerVisitPlan;