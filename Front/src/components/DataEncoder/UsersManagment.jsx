import React, { useState, useEffect } from 'react';
import {
  Table, Space, Button, Input, Modal, Form, Select, message, Card, Typography,
  Avatar, Tag, Divider, Badge, Popconfirm
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined,
  IdcardOutlined, SafetyOutlined, CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import styled from 'styled-components';

// Color palette
const primaryColor = '#10B981'; // Emerald green
const lightGreen = '#D1FAE5';
const darkGreen = '#059669';
const textColor = '#1F2937';
const secondaryText = '#6B7280';

const { Option } = Select;
const { Title, Text } = Typography;

// Styled components
const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: none;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  }

  .ant-card-head {
    border-bottom: 1px solid #E5E7EB;
  }

  .ant-card-body {
    padding: 0;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: ${primaryColor};
  border-color: ${primaryColor};
  color: white;
  font-weight: 500;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover, &:focus {
    background-color: ${darkGreen};
    border-color: ${darkGreen};
    color: white;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  border-color: ${primaryColor};
  color: ${primaryColor};
  font-weight: 500;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover, &:focus {
    color: ${darkGreen};
    border-color: ${darkGreen};
  }
`;

const EmailInputContainer = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.3s;
  height: 40px;

  &:hover {
    border-color: ${primaryColor};
  }

  &:focus-within {
    border-color: ${primaryColor};
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  input {
    border: none !important;
    box-shadow: none !important;
    padding-left: 0;
    height: 38px;
  }

  .domain-part {
    color: ${secondaryText};
    font-size: 14px;
    margin-left: 4px;
  }
`;

const UserAvatar = styled(Avatar)`
  background-color: ${lightGreen};
  color: ${primaryColor};
  margin-right: 12px;
`;

const RoleTag = styled(Tag)`
  background-color: ${lightGreen};
  color: ${darkGreen};
  border-color: ${primaryColor}33;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
`;

const Users = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/users');
      setUsers(res.data.data || []);
    } catch {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/roles');
      setRoles(res.data.data || []);
    } catch {
      message.error('Failed to fetch roles');
    }
  };

  const handleAddUser = async () => {
    try {
      const values = await form.validateFields();
      values.email = `${values.email}@andemamma.com`;
      setLoading(true);
      await axios.post('http://localhost:5000/users', values);
      message.success('User added successfully');
      form.resetFields();
      setEmailPrefix('');
      setIsModalVisible(false);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const values = await form.validateFields();
      values.email = `${values.email}@andemamma.com`;
      setLoading(true);
      await axios.put(`http://localhost:5000/users/${selectedUser.user_id}`, values);
      message.success('User updated successfully');
      form.resetFields();
      setEmailPrefix('');
      setIsModalVisible(false);
      setIsDetailVisible(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/users/${userId}`);
      message.success('User deleted successfully');
      fetchUsers();
      if (selectedUser?.user_id === userId) {
        setIsDetailVisible(false);
      }
    } catch {
      message.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/@.*$/, '');
    setEmailPrefix(value);
    form.setFieldsValue({ email: value });
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setIsDetailVisible(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    const emailPrefix = user.email.replace('@andemamma.com', '');
    setEmailPrefix(emailPrefix);
    form.setFieldsValue({
      ...user,
      email: emailPrefix
    });
    setIsModalVisible(true);
  };

  // Filter out admin@andemamma.com and apply search
  const filteredUsers = users
    .filter(user => user.email !== 'admin@andemamma.com')
    .filter(user => {
      const searchFields = [user.first_name, user.last_name, user.email, user.company_role_name];
      return searchFields.some(field => 
        field?.toLowerCase().includes(searchText.toLowerCase())
      );
    })
    .sort((a, b) => b.user_id - a.user_id); // Sort by user_id descending

  const columns = [
    {
      title: 'USER',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => showUserDetails(record)}
        >
          <UserAvatar size={40} icon={<UserOutlined />} />
          <div>
            <Text strong style={{ color: textColor, display: 'block' }}>
              {`${record.first_name} ${record.last_name}`}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
      sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    },
    {
      title: 'ROLE',
      dataIndex: 'company_role_name',
      key: 'role',
      render: (text) => <RoleTag>{text}</RoleTag>,
      sorter: (a, b) => a.company_role_name.localeCompare(b.company_role_name)
    },
    {
      title: 'STATUS',
      key: 'status',
      render: () => (
        <Badge 
          status="success" 
          text="Active" 
          style={{ color: primaryColor, fontWeight: 500 }}
        />
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => true, // Placeholder for actual status filter
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: primaryColor }} />} 
            onClick={(e) => {
              e.stopPropagation();
              handleEditUser(record);
            }}
          />
          <Popconfirm
            title="Delete this user?"
            description="Are you sure you want to delete this user account?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteUser(record.user_id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined style={{ color: '#EF4444' }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}
    >
      <StyledCard
        title={
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Title level={4} style={{ margin: 0, color: textColor }}>User Management</Title>
            <Text type="secondary" style={{ marginTop: 4 }}>
              Manage all system users and their permissions
            </Text>
          </div>
        }
        extra={
          <Space style={{ marginTop: 16 }}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined style={{ color: secondaryText }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
            />
            <PrimaryButton
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedUser(null);
                form.resetFields();
                setEmailPrefix('');
                setIsModalVisible(true);
              }}
            >
              Add User
            </PrimaryButton>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="user_id"
          loading={loading}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => (
              <Text strong style={{ color: textColor }}>
                Showing {total} users
              </Text>
            ),
            position: ['bottomRight'],
          }}
          scroll={{ x: true }}
          style={{ borderTop: '1px solid #E5E7EB' }}
          onRow={(record) => ({
            onClick: () => showUserDetails(record),
            style: { cursor: 'pointer' }
          })}
        />
      </StyledCard>

      {/* Add/Edit User Modal */}
      <Modal
        title={
          <Text strong style={{ fontSize: 18, color: textColor }}>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </Text>
        }
        open={isModalVisible}
        onCancel={() => {
          form.resetFields();
          setEmailPrefix('');
          setIsModalVisible(false);
        }}
        onOk={selectedUser ? handleUpdateUser : handleAddUser}
        okText={selectedUser ? 'Update User' : 'Add User'}
        confirmLoading={loading}
        okButtonProps={{
          style: { backgroundColor: primaryColor, borderColor: primaryColor }
        }}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'Please input first name' }]}
            >
              <Input 
                placeholder="John" 
                prefix={<UserOutlined style={{ color: secondaryText }} />}
                style={{ borderRadius: 8, height: 40 }}
              />
            </Form.Item>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Please input last name' }]}
            >
              <Input 
                placeholder="Doe" 
                prefix={<UserOutlined style={{ color: secondaryText }} />}
                style={{ borderRadius: 8, height: 40 }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              {
                pattern: /^[0-9+\-()\s]*$/,
                message: 'Invalid phone number format'
              }
            ]}
          >
            <Input 
              placeholder="e.g. 0912345678" 
              prefix={<PhoneOutlined style={{ color: secondaryText }} />}
              style={{ borderRadius: 8, height: 40 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email prefix' },
              {
                pattern: /^[a-zA-Z0-9._-]+$/,
                message: 'Invalid email prefix'
              },
              {
                max: 30,
                message: 'Email must be less than 30 characters'
              }
            ]}
          >
            <EmailInputContainer>
              <Input
                placeholder="username"
                value={emailPrefix}
                onChange={handleEmailChange}
              />
              <span className="domain-part">@andemamma.com</span>
            </EmailInputContainer>
          </Form.Item>

          <Form.Item
            name="company_role_id"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select
              placeholder="Select a role"
              showSearch
              optionFilterProp="children"
              suffixIcon={<SafetyOutlined style={{ color: secondaryText }} />}
              style={{ borderRadius: 8, height: 40 }}
            >
              {roles.map(role => (
                <Option key={role.company_role_id} value={role.company_role_id}>
                  {role.company_role_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        title={null}
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={null}
        width={700}
        closable={false}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {selectedUser && (
          <div style={{ padding: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <UserAvatar size={64} icon={<UserOutlined />} />
                <div>
                  <Title level={4} style={{ margin: 0, color: textColor }}>
                    {`${selectedUser.first_name} ${selectedUser.last_name}`}
                  </Title>
                  <Text type="secondary">{selectedUser.email}</Text>
                </div>
              </div>
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => setIsDetailVisible(false)}
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 24,
              marginBottom: 24
            }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: secondaryText }}>
                  <IdcardOutlined style={{ marginRight: 8 }} />
                  Role
                </Text>
                <RoleTag>{selectedUser.company_role_name}</RoleTag>
              </div>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: secondaryText }}>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  Phone
                </Text>
                <Text>{selectedUser.phone || 'Not provided'}</Text>
              </div>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: secondaryText }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Status
                </Text>
                <Badge 
                  status="success" 
                  text="Active" 
                  style={{ color: primaryColor, fontWeight: 500 }}
                />
              </div>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, color: secondaryText }}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  Email
                </Text>
                <Text>{selectedUser.email}</Text>
              </div>
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <SecondaryButton
                icon={<EditOutlined />}
                onClick={() => {
                  setIsDetailVisible(false);
                  handleEditUser(selectedUser);
                }}
              >
                Edit User
              </SecondaryButton>
              <Popconfirm
                title="Delete this user?"
                description="Are you sure you want to delete this user account?"
                onConfirm={() => handleDeleteUser(selectedUser.user_id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                >
                  Delete User
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Users;