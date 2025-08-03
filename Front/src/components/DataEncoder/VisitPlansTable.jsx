import React, { useState, useEffect } from 'react';
import { 
  List,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Badge,
  Divider,
  Radio,
  Typography,
  message,
  Popover,
  Space,
  Tabs,
  DatePicker
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined, 
  FileDoneOutlined, 
  FieldTimeOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Text, Title } = Typography;
const { Option } = Select;

const statusOptions = [
  { value: 'Pending', label: 'Pending', icon: <FieldTimeOutlined />, color: 'blue' },
  { value: 'Completed', label: 'Completed', icon: <CheckCircleOutlined />, color: 'green' },
  { value: 'Cancelled', label: 'Cancelled', icon: <CloseCircleOutlined />, color: 'red' },
  { value: 'Rescheduled', label: 'Rescheduled', icon: <SyncOutlined />, color: 'orange' },
  { value: 'Follow-up', label: 'Follow-up', icon: <FileDoneOutlined />, color: 'purple' },
];

const feedbackOptions = [
  { value: 'unaware', label: 'Unaware', color: 'gray' },
  { value: 'against', label: 'Against', color: 'volcano' },
  { value: 'neutral', label: 'Neutral', color: 'gold' },
  { value: 'supportive', label: 'Supportive', color: 'green' },
  { value: 'interested', label: 'Interested', color: 'cyan' },
];

const VisitPlanner = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(moment());

  // Group visits by date
  const groupVisitsByDate = (visits) => {
    const grouped = {};
    visits.forEach(visit => {
      const date = moment(visit.visit_date).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(visit);
    });
    return grouped;
  };

  // Get dates from today forward
  const getFutureDates = (visits) => {
    const dates = Object.keys(groupVisitsByDate(visits))
      .filter(date => moment(date).isSameOrAfter(moment(), 'day'))
      .sort((a, b) => moment(a).diff(moment(b)));
    return dates;
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    filterVisits();
  }, [visits, searchText, statusFilter, selectedDate]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/marketer-visits');
      setVisits(res.data.data);
    } catch (err) {
      message.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const filterVisits = () => {
    let result = [...visits];
    
    // Filter by search text
    if (searchText) {
      result = result.filter(visit => 
        visit.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
        visit.contact_person.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(visit => visit.status === statusFilter);
    }
    
    // Filter by date
    if (selectedDate) {
      result = result.filter(visit => 
        moment(visit.visit_date).isSame(selectedDate, 'day')
      );
    }
    
    setFilteredVisits(result);
  };

  const handleStatusUpdate = async (values) => {
    try {
      await axios.put(`http://localhost:5000/api/marketer-visits/${currentVisit.id}`, values);
      fetchVisits();
      setVisible(false);
      message.success('Visit updated successfully');
    } catch (err) {
      message.error('Failed to update visit');
    }
  };

  const getStatusTag = (status) => {
    const option = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <Tag 
        icon={option.icon} 
        color={option.color}
        className="flex items-center px-3 py-1 rounded-full"
      >
        {option.label}
      </Tag>
    );
  };

  const handleQuickStatusChange = async (visitId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/marketer-visits/${visitId}`, {
        status: newStatus
      });
      message.success(`Status updated to ${newStatus}`);
      fetchVisits();
    } catch (err) {
      message.error('Failed to update status');
    }
  };

  const StatusActions = ({ visit }) => (
    <Popover
      placement="bottomRight"
      trigger="click"
      content={
        <div className="space-y-2 w-40">
          {statusOptions.map(option => (
            <div
              key={option.value}
              onClick={() => handleQuickStatusChange(visit.id, option.value)}
              className={`flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-${option.color}-50`}
            >
              <span className={`text-${option.color}-500 mr-2`}>{option.icon}</span>
              <span className="text-gray-700">{option.label}</span>
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
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <CalendarOutlined className="text-blue-500 text-2xl mr-3" />
            <Title level={3} className="m-0 text-gray-800">Supplier Visits</Title>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              placeholder="Search suppliers..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-64 rounded-lg border-gray-300 hover:border-blue-400 focus:border-blue-500"
              allowClear
            />
            
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full sm:w-40 rounded-lg"
              suffixIcon={<FilterOutlined className="text-gray-400" />}
            >
              <Option value="all">All Statuses</Option>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="flex items-center">
                    <span className={`text-${option.color}-500 mr-2`}>{option.icon}</span>
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
            
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="w-full sm:w-40 rounded-lg"
              suffixIcon={<CalendarOutlined className="text-gray-400" />}
              disabledDate={(current) => current && current < moment().startOf('day')}
            />
          </div>
        </div>

        <div className="mb-4">
          <Text strong className="text-lg text-gray-700">
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </Text>
          <Badge 
            count={filteredVisits.length} 
            className="ml-2 bg-blue-500"
          />
        </div>

        {filteredVisits.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={filteredVisits}
            renderItem={(visit) => (
              <List.Item
                className="hover:bg-gray-50 px-4 py-3 rounded-lg cursor-pointer"
                onClick={() => {
                  setCurrentVisit(visit);
                  form.setFieldsValue({
                    status: visit.status,
                    feedback: visit.feedback,
                    notes: visit.notes
                  });
                  setVisible(true);
                }}
                extra={
                  <div className="flex items-center space-x-2">
                    {getStatusTag(visit.status)}
                    <StatusActions visit={visit} />
                  </div>
                }
              >
                <List.Item.Meta
                  title={<Text strong className="text-gray-800">{visit.company_name}</Text>}
                  description={
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600">
                        <UserOutlined className="mr-2" />
                        <Text>{visit.contact_person}</Text>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <PhoneOutlined className="mr-2" />
                        <Text>{visit.supplier_phone}</Text>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <EnvironmentOutlined className="mr-2" />
                        <Text>{visit.supplier_location}</Text>
                      </div>
                      {visit.notes && (
                        <div className="mt-2">
                          <Text className="text-gray-600" ellipsis>
                            <strong>Notes:</strong> {visit.notes}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-300 mb-4">
              <CalendarOutlined className="text-4xl" />
            </div>
            <Text className="text-gray-500 text-lg">
              No visits scheduled for this day
            </Text>
          </div>
        )}
      </div>

      {/* Modern Modal */}
      <Modal
        title={<span className="text-xl font-semibold text-gray-800">Update Visit Details</span>}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={700}
        centered
        className="rounded-xl"
        bodyStyle={{ padding: 0 }}
      >
        {currentVisit && (
          <div className="p-6">
            <div className="mb-6">
              <Title level={4} className="mb-2">{currentVisit.company_name}</Title>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Text strong className="block text-gray-500 mb-1">Contact</Text>
                  <Text>{currentVisit.contact_person}</Text>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Text strong className="block text-gray-500 mb-1">Phone</Text>
                  <Text>{currentVisit.supplier_phone}</Text>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Text strong className="block text-gray-500 mb-1">Date & Time</Text>
                  <Text>{moment(currentVisit.visit_date).format('MMMM D, YYYY h:mm A')}</Text>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Text strong className="block text-gray-500 mb-1">Location</Text>
                  <Text>{currentVisit.supplier_location}</Text>
                </div>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleStatusUpdate}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Visit Status</h4>
                  <Form.Item
                    name="status"
                    rules={[{ required: true, message: 'Please select status' }]}
                  >
                    <Radio.Group className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {statusOptions.map(option => (
                        <Radio.Button 
                          key={option.value} 
                          value={option.value}
                          className={`flex items-center justify-center p-3 rounded-lg border-2 hover:border-${option.color}-300`}
                          style={{ 
                            borderColor: option.color === 'blue' ? '#93c5fd' : 
                                        option.color === 'green' ? '#86efac' : 
                                        option.color === 'red' ? '#fca5a5' : 
                                        option.color === 'orange' ? '#fdba74' : '#d8b4fe'
                          }}
                        >
                          <span className={`text-${option.color}-500 mr-2`}>
                            {option.icon}
                          </span>
                          <span>{option.label}</span>
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Supplier Feedback</h4>
                  <Form.Item name="feedback">
                    <Select
                      placeholder="Select feedback"
                      className="w-full rounded-lg"
                      options={feedbackOptions.map(f => ({
                        value: f.value,
                        label: (
                          <Tag color={f.color} className="px-2 py-1 rounded-full">
                            {f.label}
                          </Tag>
                        )
                      }))}
                    />
                  </Form.Item>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Visit Notes</h4>
                  <Form.Item name="notes">
                    <Input.TextArea 
                      rows={4} 
                      placeholder="Enter any additional notes about the visit..."
                      className="rounded-lg border-gray-300 hover:border-blue-400 focus:border-blue-500"
                    />
                  </Form.Item>
                </div>
              </div>

              <Divider className="my-6" />

              <div className="flex justify-end gap-3">
                <Button 
                  onClick={() => setVisible(false)}
                  className="h-10 px-6 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="h-10 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 border-0 shadow-sm"
                >
                  Update Visit
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VisitPlanner;