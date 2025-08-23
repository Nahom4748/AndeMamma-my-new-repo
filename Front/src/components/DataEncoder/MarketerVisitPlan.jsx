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
  Steps,
  Descriptions,
  Radio
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
  CheckOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileDoneOutlined,
  FieldTimeOutlined
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";

const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { Step } = Steps;
const { confirm } = Modal;

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const visitTypes = [
  { value: 'sourcing', label: 'Sourcing', color: 'bg-emerald-500', icon: '🛒' },
  { value: 'product', label: 'Product', color: 'bg-blue-500', icon: '📦' },
  { value: 'strategic', label: 'Strategic', color: 'bg-indigo-500', icon: '📊' },
  { value: 'followup', label: 'Follow-up', color: 'bg-amber-500', icon: '🔄' },
];

const feedbackOptions = [
  { value: 'unaware', label: 'Unaware', icon: '❓', color: 'bg-gray-400' },
  { value: 'against', label: 'Against', icon: '👎', color: 'bg-red-400' },
  { value: 'neutral', label: 'Neutral', icon: '✋', color: 'bg-yellow-400' },
  { value: 'supportive', label: 'Supportive', icon: '👍', color: 'bg-green-400' },
  { value: 'interested', label: 'Interested', icon: '💡', color: 'bg-blue-400' },
  { value: 'rejected', label: 'Rejected', icon: '🚫', color: 'bg-red-500' },
];

const resultOptions = [
  { value: 'followup_letter', label: 'Letter Submitted for Follow-up' },
  { value: 'permit_collected', label: 'Permit Collected' },
  { value: 'site_visited', label: 'Site Visited' },
  { value: 'followup_required', label: 'Follow-up Visit Required' },
  { value: 'outlet_visited', label: 'Outlet Visited' },
  { value: 'other', label: 'Other Result' },
];

const statusOptions = [
  { label: 'Planned', value: 'planned', icon: <FieldTimeOutlined />, color: 'bg-blue-400' },
  { label: 'Completed', value: 'completed', icon: <CheckOutlined />, color: 'bg-green-400' },
  { label: 'Cancelled', value: 'cancelled', icon: <CloseCircleOutlined />, color: 'bg-red-400' },
  { label: 'Rescheduled', value: 'rescheduled', icon: <SyncOutlined />, color: 'bg-amber-400' },
  { label: 'Follow-up', value: 'followup', icon: <FileDoneOutlined />, color: 'bg-indigo-400' },
];

const MarketerVisitPlan = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [visitPlans, setVisitPlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    moment().startOf('week').add(1, 'day')
  );
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(
    moment().day() === 0 ? "0" : Math.max(0, moment().day() - 1).toString()
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();

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
          end_date: currentWeekStart.clone().add(5, 'days').format("YYYY-MM-DD")
        }
      });
      
      const plans = {};
      res.data.data.forEach(plan => {
        const dateStr = moment(plan.visit_date).format("YYYY-MM-DD");
        if (!plans[dateStr]) {
          plans[dateStr] = [];
        }
        plans[dateStr].push({
          ...plan,
          supplierId: plan.supplier_id,
          notes: plan.details,
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

  const showStatusModal = (visit) => {
    setSelectedVisit(visit);
    statusForm.setFieldsValue({
      status: visit.status || 'planned',
      feedback: visit.feedback,
      result: visit.result,
      additional_notes: visit.additional_notes
    });
    setStatusModalVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  const onStatusModalClose = () => {
    setStatusModalVisible(false);
  };

  const handleAddVisit = (values) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    const newPlan = { 
      supplierId: values.supplier, 
      type: values.type,
      notes: values.notes,
      id: Date.now(),
      status: 'planned'
    };
    
    setVisitPlans(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newPlan]
    }));
    
    message.success('Visit added successfully!');
    onClose();
  };

  const handleStatusUpdate = async (values) => {
    try {
      const updatedVisit = {
        ...selectedVisit,
        status: values.status,
        feedback: values.feedback,
        result: values.result,
        additional_notes: values.additional_notes,
        completed_at: values.status === 'completed' ? moment().format() : null
      };

      // Update in local state first for immediate UI feedback
      const dateStr = moment(selectedVisit.visit_date).format("YYYY-MM-DD");
      setVisitPlans(prev => ({
        ...prev,
        [dateStr]: prev[dateStr].map(v => 
          v.id === selectedVisit.id ? updatedVisit : v
        )
      }));

      // API call to update in backend
      await axios.put(`http://localhost:5000/api/marketer-visits/${selectedVisit.id}`, updatedVisit);
      
      message.success('Visit status updated successfully!');
      onStatusModalClose();
    } catch (err) {
      message.error('Failed to update visit status');
      console.error('Error updating visit:', err);
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
      if (typeof visitId === 'number' && visitId > 10000000000) {
        setVisitPlans(prev => {
          const updatedPlans = { ...prev };
          updatedPlans[dateStr] = updatedPlans[dateStr].filter(v => v.id !== visitId);
          return updatedPlans;
        });
        message.success('Visit removed successfully');
      } else {
        await axios.delete(`http://localhost:5000/api/marketer-visits/${visitId}`);
        setVisitPlans(prev => {
          const updatedPlans = { ...prev };
          updatedPlans[dateStr] = updatedPlans[dateStr].filter(v => v.id !== visitId);
          return updatedPlans;
        });
        message.success('Visit deleted successfully');
      }
    } catch (err) {
      message.error('Failed to delete visit');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const plans = Object.entries(visitPlans).flatMap(([date, entries]) =>
        entries.filter(e => !moment(date).isBefore(moment().startOf('day')))
          .map(e => ({
            visit_date: date,
            supplier_id: e.supplierId,
            type: e.type,
            details: e.notes,
            marketer_id: 2,
            status: e.status || 'planned'
          }))
      );

      await axios.post("http://localhost:5000/api/marketer-visits", { plans });
      message.success("Visit plan submitted successfully!");
      fetchExistingPlans();
    } catch (err) {
      message.error("Failed to submit visit plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (dir) => {
    const newWeek = currentWeekStart.clone().add(dir * 7, "days");
    if (newWeek.isSameOrAfter(moment().startOf('week').add(1, 'day'), 'day')) {
      setCurrentWeekStart(newWeek);
      setActiveTab("0");
    } else {
      message.warning("You can only plan for current or future weeks");
    }
  };

  const weekDates = getWeekDates();
  const filteredSuppliers = suppliers
    .filter(s => s.company_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.company_name.localeCompare(b.company_name));

  const getStatusTag = (status) => {
    const option = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <Tag 
        icon={option.icon} 
        className={`${option.color} text-white flex items-center px-2 py-0.5`}
      >
        {option.label}
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
                    {weekDates[0].format("MMM D")} - {weekDates[5].format("MMM D, YYYY")}
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
              <Button
                type="primary"
                loading={loading}
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 h-10 rounded-lg shadow-sm w-full sm:w-auto text-sm"
              >
                <span className="hidden sm:inline">Submit Plan</span>
                <span className="sm:hidden">Submit</span>
              </Button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4 md:mt-6 bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-100">
            <Button 
              onClick={() => handleWeekChange(-1)}
              disabled={currentWeekStart.isSame(moment().startOf('week').add(1, 'day'), 'week')}
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
                              className={`p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-emerald-100 transition-colors ${isPast ? 'opacity-75 bg-gray-50' : 'bg-white'}`}
                              onClick={() => showStatusModal(entry)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <Avatar
                                    src={`https://ui-avatars.com/api/?name=${supplier?.company_name}&background=10b981&color=fff`}
                                    size={40}
                                    icon={<UserOutlined />}
                                    className="flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start">
                                      <div className="font-medium text-gray-800 truncate text-sm sm:text-base">
                                        {supplier?.company_name}
                                      </div>
                                      {getStatusTag(entry.status || 'planned')}
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
                                    {entry.feedback && (
                                      <div className="mt-2">
                                        <Tag className={`${feedbackOptions.find(f => f.value === entry.feedback)?.color || 'bg-gray-200'} text-white text-xs`}>
                                          Feedback: {feedbackOptions.find(f => f.value === entry.feedback)?.label}
                                        </Tag>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isEditable && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showDeleteConfirm(dateStr, entry.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 ml-1"
                                    aria-label="Delete visit"
                                  >
                                    <DeleteOutlined className="text-xs sm:text-sm" />
                                  </button>
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

        {/* Visit Status Modal */}
        <Modal
          title="Update Visit Status"
          open={statusModalVisible}
          onCancel={onStatusModalClose}
          footer={null}
          width={Math.min(window.innerWidth * 0.9, 600)}
          centered
          className="rounded-xl"
        >
          {selectedVisit && (
            <Form
              form={statusForm}
              layout="vertical"
              onFinish={handleStatusUpdate}
              initialValues={{
                status: selectedVisit.status || 'planned'
              }}
            >
              <div className="p-4">
                <div className="mb-6">
                  <Steps current={statusOptions.findIndex(opt => opt.value === (selectedVisit.status || 'planned'))} size="small">
                    {statusOptions.map(opt => (
                      <Step key={opt.value} title={opt.label} />
                    ))}
                  </Steps>
                </div>

                <div className="mb-6">
                  <Descriptions column={1} size="small" className="visit-details">
                    <Descriptions.Item label="Supplier">
                      {suppliers.find(s => s.id === selectedVisit.supplierId)?.company_name || 'Unknown'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Visit Date">
                      {moment(selectedVisit.visit_date).format('MMMM D, YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Visit Type">
                      {visitTypes.find(t => t.value === selectedVisit.type)?.label || selectedVisit.type}
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true }]}
                >
                  <Radio.Group className="grid grid-cols-2 gap-3">
                    {statusOptions.map(option => (
                      <Radio.Button 
                        key={option.value} 
                        value={option.value}
                        className={`flex items-center justify-center p-3 rounded-lg ${option.color} text-white`}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="feedback"
                  label="Supplier Feedback"
                >
                  <Select
                    placeholder="Select feedback"
                    className="w-full rounded-lg"
                    options={feedbackOptions.map(f => ({
                      value: f.value,
                      label: (
                        <div className="flex items-center">
                          <span className="mr-2">{f.icon}</span>
                          {f.label}
                        </div>
                      )
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="result"
                  label="Visit Result"
                >
                  <Select
                    placeholder="Select result"
                    className="w-full rounded-lg"
                    options={resultOptions}
                  />
                </Form.Item>

                <Form.Item
                  name="additional_notes"
                  label="Additional Notes"
                >
                  <Input.TextArea 
                    rows={3} 
                    placeholder="Enter any additional notes about the visit"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Divider className="my-4" />

                <div className="flex justify-end gap-3">
                  <Button 
                    onClick={onStatusModalClose}
                    className="rounded-lg h-10 px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 h-10 px-6 rounded-lg shadow-sm"
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default MarketerVisitPlan;