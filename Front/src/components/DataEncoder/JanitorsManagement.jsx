import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Input,
  Spin,
  Space,
  Button,
  DatePicker,
  Select,
  Switch,
  Tag,
  Avatar,
  Badge,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MarketerSupplierDashboard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const marketerId = 3; // Fixed to only show marketer ID 4's suppliers

  useEffect(() => {
    fetchAssignedSuppliers();
  }, []);

  const fetchAssignedSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/suppliers/by-marketer/${marketerId}`);
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to load assigned suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (supplierId, newStatus) => {
    try {
      setSaving(true);
      await axios.patch(`http://localhost:5000/suppliers/update-status/${supplierId}`, {
        is_active: newStatus
      });
      message.success(`Supplier marked as ${newStatus ? 'active' : 'inactive'}`);
      fetchAssignedSuppliers();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVisit = async (supplierId, values) => {
    try {
      setSaving(true);
      await axios.patch(`http://localhost:5000/suppliers/update-visit/${supplierId}`, {
        last_visited_date: values.date.format('YYYY-MM-DD'),
        visit_notes: values.notes,
        visit_result: values.result
      });
      message.success('Visit details updated successfully');
      fetchAssignedSuppliers();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating visit:', error);
      message.error('Failed to update visit details');
    } finally {
      setSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActiveFilter = filterActive === 'all' || 
                              (filterActive === 'active' && supplier.is_active) ||
                              (filterActive === 'inactive' && !supplier.is_active);
    
    return matchesSearch && matchesActiveFilter;
  });

  const StatusTag = ({ status }) => (
    <Tag 
      icon={status ? <CheckCircleOutlined /> : <StopOutlined />}
      color={status ? 'success' : 'error'}
    >
      {status ? 'Active' : 'Inactive'}
    </Tag>
  );

  const columns = [
    {
      title: 'Supplier',
      dataIndex: 'company_name',
      key: 'company_name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar 
            size="large" 
            src={`https://i.pravatar.cc/150?u=${record.supplier_id}`}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong style={{ display: 'block' }}>{text}</Text>
            <Text type="secondary">{record.contact_person}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (status, record) => (
        <Popconfirm
          title={`Mark supplier as ${status ? 'inactive' : 'active'}?`}
          onConfirm={() => handleStatusUpdate(record.supplier_id, !status)}
          okText="Yes"
          cancelText="No"
        >
          <div style={{ cursor: 'pointer' }}>
            <StatusTag status={status} />
          </div>
        </Popconfirm>
      )
    },
    {
      title: 'Last Visit',
      dataIndex: 'last_visited_date',
      key: 'last_visited_date',
      width: 150,
      render: (date, record) => (
        <Tag 
          icon={<CalendarOutlined />} 
          color={date ? 'blue' : 'orange'}
        >
          {date ? dayjs(date).format('MMM D, YYYY') : 'Never'}
        </Tag>
      )
    },
    {
      title: 'Visit Details',
      key: 'visit_details',
      width: 300,
      render: (_, record) => editingId === record.supplier_id ? (
        <VisitForm 
          record={record} 
          onSave={handleSaveVisit} 
          onCancel={() => setEditingId(null)}
          saving={saving}
        />
      ) : (
        <Space direction="vertical" size={4}>
          <Text strong>Result: {record.visit_result || 'Not recorded'}</Text>
          <Text type="secondary">{record.visit_notes || 'No notes available'}</Text>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => setEditingId(record.supplier_id)}
            size="small"
          >
            Update Visit
          </Button>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Refresh data">
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchAssignedSuppliers}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            <EnvironmentOutlined /> My Assigned Suppliers (Marketer ID: {marketerId})
          </Title>
        }
        extra={
          <Space>
            <Input
              placeholder="Search suppliers..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={filterActive}
              onChange={setFilterActive}
              style={{ width: 120 }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active Only</Option>
              <Option value="inactive">Inactive Only</Option>
            </Select>
          </Space>
        }
        bordered={false}
        style={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          borderRadius: 12
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="supplier_id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            size: 'small'
          }}
          size="middle"
          style={{ borderRadius: 8 }}
        />
      </Card>
    </div>
  );
};

// Sub-component for visit form
const VisitForm = ({ record, onSave, onCancel, saving }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields()
      .then(values => onSave(record.supplier_id, values))
      .catch(info => console.log('Validate Failed:', info));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        date: record.last_visited_date ? dayjs(record.last_visited_date) : dayjs(),
        result: record.visit_result || 'site visit',
        notes: record.visit_notes || ''
      }}
    >
      <Form.Item name="date" label="Visit Date" rules={[{ required: true }]}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="result" label="Result">
        <Select>
          <Option value="site visit">Site Visit</Option>
          <Option value="contract signed">Contract Signed</Option>
          <Option value="sample collected">Sample Collected</Option>
          <Option value="follow up needed">Follow Up Needed</Option>
        </Select>
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <TextArea rows={3} />
      </Form.Item>
      <Space>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSubmit}
          loading={saving}
        >
          Save
        </Button>
        <Button 
          icon={<CloseOutlined />} 
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </Space>
    </Form>
  );
};

export default MarketerSupplierDashboard;