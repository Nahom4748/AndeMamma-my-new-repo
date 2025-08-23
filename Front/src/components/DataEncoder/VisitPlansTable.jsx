import React, { useState, useEffect } from 'react';
import {
  Tag, Button, Modal, Form, Select, Input, Badge, Divider, Radio, 
  Typography, message, Popover, Card, DatePicker, Collapse
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, FileDoneOutlined,
  FieldTimeOutlined, CalendarOutlined, UserOutlined, EnvironmentOutlined,
  PhoneOutlined, SearchOutlined, FilterOutlined, MoreOutlined, FileTextOutlined,
  ClockCircleOutlined, FrownOutlined, MehOutlined, SmileOutlined, StarOutlined,
  PlusOutlined, CheckOutlined, EditOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const statusOptions = [
  { value: 'Pending', label: 'Pending', icon: <FieldTimeOutlined />, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-800' },
  { value: 'Completed', label: 'Completed', icon: <CheckCircleOutlined />, color: 'green', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'Cancelled', label: 'Cancelled', icon: <CloseCircleOutlined />, color: 'red', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'Rescheduled', label: 'Rescheduled', icon: <SyncOutlined />, color: 'orange', bg: 'bg-orange-100', text: 'text-orange-800' },
  { value: 'Follow-up', label: 'Follow-up', icon: <FileDoneOutlined />, color: 'purple', bg: 'bg-purple-100', text: 'text-purple-800' },
];

const feedbackOptions = [
  { value: 'unaware', label: 'Unaware', icon: <FrownOutlined />, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-800' },
  { value: 'against', label: 'Against', icon: <FrownOutlined />, color: 'red', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'neutral', label: 'Neutral', icon: <MehOutlined />, color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'supportive', label: 'Supportive', icon: <SmileOutlined />, color: 'green', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'interested', label: 'Interested', icon: <StarOutlined />, color: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-800' },
];

const dayOptions = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
];

const VisitPlanner = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDayOption, setSelectedDayOption] = useState('today');

  useEffect(() => { fetchVisits(); }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/marketer-visits');
      setVisits(res.data.data);
    } catch {
      message.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  // Filter visits based on selected time period
  const getFilteredVisits = () => {
    let filtered = [...visits];
    
    // Filter by time period
    switch(selectedDayOption) {
      case 'today':
        filtered = filtered.filter(v => moment(v.visit_date).isSame(moment(), 'day'));
        break;
      case 'tomorrow':
        filtered = filtered.filter(v => moment(v.visit_date).isSame(moment().add(1, 'day'), 'day'));
        break;
      case 'this-week':
        filtered = filtered.filter(v => moment(v.visit_date).isBetween(
          moment().startOf('week'), moment().endOf('week'), null, '[]'
        ));
        break;
      case 'next-week':
        filtered = filtered.filter(v => moment(v.visit_date).isBetween(
          moment().add(1, 'week').startOf('week'), moment().add(1, 'week').endOf('week'), null, '[]'
        ));
        break;
      default:
        break;
    }
    
    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(v => 
        v.company_name.toLowerCase().includes(search) || 
        v.contact_person.toLowerCase().includes(search)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    return filtered;
  };

  const handleStatusUpdate = async (values) => {
    try {
      await axios.put(`http://localhost:5000/api/marketer-visits/${currentVisit.id}`, values);
      fetchVisits();
      setVisible(false);
      message.success('Visit updated successfully');
    } catch {
      message.error('Failed to update visit');
    }
  };

  const handleQuickStatusChange = async (visitId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/marketer-visits/${visitId}`, { status: newStatus });
      fetchVisits();
      message.success(`Status updated to ${newStatus}`);
    } catch {
      message.error('Failed to update status');
    }
  };

  const StatusActions = ({ visit }) => (
    <Popover
      placement="bottomRight"
      trigger="click"
      content={
        <div className="space-y-1 w-36">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleQuickStatusChange(visit.id, option.value)}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${option.bg} ${option.text} hover:opacity-80 transition-opacity`}
            >
              <span className="mr-2">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <button className="text-gray-500 hover:text-blue-500 p-1 rounded-full">
        <MoreOutlined />
      </button>
    </Popover>
  );

  const renderVisitCard = (visit) => {
    const status = statusOptions.find(s => s.value === visit.status) || statusOptions[0];
    const feedback = feedbackOptions.find(f => f.value === visit.feedback);
    
    return (
      <motion.div
        key={visit.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden mb-3"
        onClick={() => {
          setCurrentVisit(visit);
          form.setFieldsValue({
            status: visit.status,
            feedback: visit.feedback,
            notes: visit.notes
          });
          setVisible(true);
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{visit.company_name}</h3>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <UserOutlined className="mr-1" />
                <span>{visit.contact_person}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <EnvironmentOutlined className="mr-1" />
                <span className="truncate max-w-[160px]">{visit.supplier_location}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <Tag 
                color={status.color} 
                className={`${status.bg} ${status.text} text-xs font-medium px-2 py-0.5 rounded-full flex items-center`}
              >
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Tag>
              {feedback && (
                <Tag 
                  color={feedback.color} 
                  className={`${feedback.bg} ${feedback.text} text-xs font-medium px-2 py-0.5 rounded-full mt-1 flex items-center`}
                >
                  {feedback.icon}
                  <span className="ml-1">{feedback.label}</span>
                </Tag>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <ClockCircleOutlined className="mr-1" />
              <span>{moment(visit.visit_date).format('h:mm A')}</span>
            </div>
            <div className="flex space-x-2">
              <StatusActions visit={visit} />
            </div>
          </div>
        </div>
        
        {visit.notes && (
          <Collapse ghost className="border-t border-gray-100">
            <Panel 
              header={
                <div className="flex items-center text-xs text-blue-600 font-medium px-4 py-2">
                  <FileTextOutlined className="mr-2" />
                  View Notes
                </div>
              } 
              key="1"
            >
              <div className="px-4 pb-3 text-xs text-gray-600">{visit.notes}</div>
            </Panel>
          </Collapse>
        )}
      </motion.div>
    );
  };

  const filteredVisits = getFilteredVisits();

  // Calculate counts for each time period
  const todayVisits = visits.filter(v => moment(v.visit_date).isSame(moment(), 'day'));
  const tomorrowVisits = visits.filter(v => moment(v.visit_date).isSame(moment().add(1, 'day'), 'day'));
  const thisWeekVisits = visits.filter(v => moment(v.visit_date).isBetween(
    moment().startOf('week'), moment().endOf('week'), null, '[]'
  ));
  const nextWeekVisits = visits.filter(v => moment(v.visit_date).isBetween(
    moment().add(1, 'week').startOf('week'), moment().add(1, 'week').endOf('week'), null, '[]'
  ));
  const pendingVisits = visits.filter(v => v.status === 'Pending');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-xl shadow-sm mr-3">
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Visits</p>
              <h1 className="text-xl font-bold text-gray-800">Visit Planner</h1>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-3">
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="rounded-lg"
              allowClear
              size="small"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="rounded-lg min-w-[120px]"
              suffixIcon={<FilterOutlined className="text-gray-400" />}
              size="small"
            >
              <Option value="all">All Status</Option>
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  <div className="flex items-center">
                    <span className={`${opt.text} mr-2`}>{opt.icon}</span>
                    {opt.label}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { title: "Today", count: todayVisits.length, icon: <ClockCircleOutlined />, color: 'bg-blue-100', text: 'text-blue-800' },
            { title: "Tomorrow", count: tomorrowVisits.length, icon: <CalendarOutlined />, color: 'bg-purple-100', text: 'text-purple-800' },
            { title: "This Week", count: thisWeekVisits.length, icon: <CalendarOutlined />, color: 'bg-green-100', text: 'text-green-800' },
            { title: "Pending", count: pendingVisits.length, icon: <FieldTimeOutlined />, color: 'bg-orange-100', text: 'text-orange-800' },
          ].map((stat, index) => (
            <div key={index} className={`${stat.color} ${stat.text} rounded-xl p-3 shadow-xs`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium">{stat.title}</p>
                  <p className="text-lg font-bold">{stat.count}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/50">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Day Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {dayOptions.map(option => {
            const count = option.value === 'today' ? todayVisits.length :
                          option.value === 'tomorrow' ? tomorrowVisits.length :
                          option.value === 'this-week' ? thisWeekVisits.length :
                          nextWeekVisits.length;
            
            return (
              <button
                key={option.value}
                onClick={() => setSelectedDayOption(option.value)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center ${
                  selectedDayOption === option.value 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.label}
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    selectedDayOption === option.value 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Visits List Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {selectedDayOption === 'today' && `Today, ${moment().format('MMM D')}`}
            {selectedDayOption === 'tomorrow' && `Tomorrow, ${moment().add(1, 'day').format('MMM D')}`}
            {selectedDayOption === 'this-week' && `This Week, ${moment().startOf('week').format('MMM D')}-${moment().endOf('week').format('MMM D')}`}
            {selectedDayOption === 'next-week' && `Next Week, ${moment().add(1, 'week').startOf('week').format('MMM D')}-${moment().add(1, 'week').endOf('week').format('MMM D')}`}
          </h2>
          <span className="text-xs text-gray-500">{filteredVisits.length} visits</span>
        </div>

        {/* Visits List */}
        {filteredVisits.length > 0 ? (
          <motion.div layout className="space-y-3">
            {filteredVisits.map(visit => renderVisitCard(visit))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <CalendarOutlined className="text-3xl text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No visits scheduled</p>
            <button className="mt-3 text-xs text-blue-600 font-medium flex items-center justify-center mx-auto">
              <PlusOutlined className="mr-1" />
              Schedule a visit
            </button>
          </div>
        )}
      </div>

      {/* Visit Details Modal */}
      <Modal
        title={null}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        centered
        className="bottom-sheet-modal"
        width="100%"
        style={{ maxWidth: '420px' }}
        styles={{ body: { padding: 0 } }}
      >
        {currentVisit && (
          <div>
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-800">Update Visit</h3>
              <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600">
                <CloseCircleOutlined />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">{currentVisit.company_name}</h3>
                <p className="text-sm text-gray-500">{currentVisit.contact_person}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <ClockCircleOutlined className="mr-1" />
                  <span>{moment(currentVisit.visit_date).format('MMM D, h:mm A')}</span>
                </div>
              </div>
              
              <Form form={form} layout="vertical" onFinish={handleStatusUpdate}>
                <Form.Item label="Status" name="status" className="mb-4">
                  <Radio.Group className="grid grid-cols-2 gap-2">
                    {statusOptions.map(option => (
                      <Radio.Button 
                        key={option.value} 
                        value={option.value}
                        className={`flex items-center justify-center py-2 text-xs rounded-lg ${
                          form.getFieldValue('status') === option.value
                            ? `${option.bg} ${option.text} border-${option.color}-300`
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="Feedback" name="feedback" className="mb-4">
                  <Radio.Group className="grid grid-cols-2 gap-2">
                    {feedbackOptions.map(option => (
                      <Radio.Button 
                        key={option.value} 
                        value={option.value}
                        className={`flex items-center justify-center py-2 text-xs rounded-lg ${
                          form.getFieldValue('feedback') === option.value
                            ? `${option.bg} ${option.text} border-${option.color}-300`
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="Notes" name="notes" className="mb-4">
                  <Input.TextArea 
                    rows={3} 
                    className="rounded-lg border-gray-200" 
                    placeholder="Add notes about the visit..."
                  />
                </Form.Item>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setVisible(false)} 
                    className="flex-1 rounded-lg border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="flex-1 rounded-lg bg-blue-500 border-none shadow-none"
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VisitPlanner;