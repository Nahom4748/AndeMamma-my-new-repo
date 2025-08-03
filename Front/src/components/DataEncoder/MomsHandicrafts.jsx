import React, { useState } from 'react';
import { Row, Col } from 'antd';

import { Table, Button, Input, Space, Typography, Tag, Modal, Form, Select, Progress, message } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  CheckOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const MomsHandicrafts = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentMom, setCurrentMom] = useState(null);

  // Mock data - replace with API calls
  const [moms, setMoms] = useState([
    {
      key: '1',
      firstName: 'Alemitu',
      lastName: 'Desta',
      phone: '0911123456',
      address: 'Addis Ababa, Kirkos',
      trainingLevel: 'Intermediate',
      products: ['Baskets', 'Table Mats'],
      progress: 65,
      status: 'Active'
    },
    {
      key: '2',
      firstName: 'Worknesh',
      lastName: 'Girma',
      phone: '0922234567',
      address: 'Addis Ababa, Bole',
      trainingLevel: 'Advanced',
      products: ['Jewelry', 'Decorations'],
      progress: 85,
      status: 'Active'
    },
    {
      key: '3',
      firstName: 'Selam',
      lastName: 'Tesfaye',
      phone: '0933345678',
      address: 'Addis Ababa, Gulele',
      trainingLevel: 'Beginner',
      products: ['Small Baskets'],
      progress: 30,
      status: 'Inactive'
    },
  ]);

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Training Level',
      dataIndex: 'trainingLevel',
      key: 'trainingLevel',
      render: level => (
        <Tag 
          color={
            level === 'Beginner' ? 'blue' : 
            level === 'Intermediate' ? 'cyan' : 
            level === 'Advanced' ? 'purple' : 'gold'
          }
          icon={level === 'Expert' ? <StarOutlined /> : null}
        >
          {level}
        </Tag>
      ),
      sorter: (a, b) => {
        const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        return levels.indexOf(a.trainingLevel) - levels.indexOf(b.trainingLevel);
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Progress 
          percent={record.progress} 
          size="small" 
          status={record.progress < 30 ? 'exception' : record.progress < 70 ? 'active' : 'success'}
        />
      ),
      sorter: (a, b) => a.progress - b.progress,
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: products => (
        <Text ellipsis={{ tooltip: products.join(', ') }}>
          {products.join(', ')}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag 
          color={status === 'Active' ? 'green' : 'red'}
          icon={status === 'Active' ? <CheckOutlined /> : null}
        >
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.key)}
          />
        </Space>
      ),
    },
  ];

  const handleAddNew = () => {
    setEditMode(false);
    setCurrentMom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditMode(true);
    setCurrentMom(record);
    form.setFieldsValue({
      ...record,
      products: record.products.join(', ')
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this mom?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setMoms(moms.filter(mom => mom.key !== key));
        message.success('Mom deleted successfully');
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const processedValues = {
        ...values,
        products: values.products.split(',').map(item => item.trim()),
        progress: values.progress || 0
      };

      if (editMode) {
        // Update existing mom
        setMoms(moms.map(mom => 
          mom.key === currentMom.key ? { ...mom, ...processedValues } : mom
        ));
        message.success('Mom updated successfully');
      } else {
        // Add new mom
        const newMom = {
          key: `new-${moms.length + 1}`,
          ...processedValues,
          status: 'Active'
        };
        setMoms([...moms, newMom]);
        message.success('Mom added successfully');
      }
      setIsModalVisible(false);
    });
  };

  const trainingLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  return (
    <div className="moms-handicrafts">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Mom's Handicrafts</Title>
        <Space>
          <Input
            placeholder="Search moms"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew}
          >
            Add Mom
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={moms.filter(mom => 
          `${mom.firstName} ${mom.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
          mom.phone.includes(searchText) ||
          mom.products.some(product => product.toLowerCase().includes(searchText.toLowerCase()))
        )} 
        bordered
        pagination={{ pageSize: 5 }}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editMode ? "Edit Mom's Details" : "Add New Mom"}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please input first name!' }]}
              >
                <Input placeholder="Enter first name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please input last name!' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please input phone number!' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trainingLevel"
                label="Training Level"
                rules={[{ required: true, message: 'Please select training level!' }]}
              >
                <Select placeholder="Select training level">
                  {trainingLevels.map(level => (
                    <Option key={level} value={level}>{level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input address!' }]}
          >
            <Input.TextArea placeholder="Enter full address" rows={2} />
          </Form.Item>
          <Form.Item
            name="products"
            label="Products (comma separated)"
            rules={[{ required: true, message: 'Please input products!' }]}
          >
            <Input.TextArea placeholder="E.g., Baskets, Table Mats, Jewelry" rows={2} />
          </Form.Item>
          <Form.Item
            name="progress"
            label="Training Progress (%)"
          >
            <Input type="number" min={0} max={100} placeholder="Enter progress percentage" />
          </Form.Item>
          {editMode && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status!' }]}
            >
              <Select placeholder="Select status">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MomsHandicrafts;