// File: src/components/Users.js
import React from 'react';
import { Table, Space, Button, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const Users = () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Edit</Button>
          <Button type="link" danger>Delete</Button>
        </Space>
      ),
    },
  ];

  const data = [
    { key: '1', name: 'Admin User', email: 'admin@andemamma.com', role: 'Admin' },
    { key: '2', name: 'Manager', email: 'manager@andemamma.com', role: 'Manager' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input 
          placeholder="Search users" 
          prefix={<SearchOutlined />} 
          style={{ width: 200 }}
        />
        <Button type="primary" style={{ marginLeft: 8 }}>
          Add j,hjkhkjkjhk
        </Button>
      </div>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default Users;