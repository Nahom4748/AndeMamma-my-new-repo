import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  message,
  Tag,
  Space,
  Typography,
  Avatar,
  Input,
  Tabs,
  Badge,
  Popconfirm,
  Spin
} from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  SearchOutlined,
  CheckOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

const SupplierMarketerAssignment = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketers, setSelectedMarketers] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, marketersRes, regionsRes] = await Promise.all([
        axios.get('/suppliers'),
        axios.get('/api/users/marketers'),
        axios.get('/regions')
      ]);

      const suppliersData = suppliersRes.data.data || suppliersRes.data;

      setSuppliers(suppliersData);
      setMarketers(marketersRes.data);
      setRegions(regionsRes.data.data);

      const initialSelections = {};
      suppliersData.forEach(supplier => {
        if (supplier.marketer_id) {
          initialSelections[supplier.id] = supplier.marketer_id;
        }
      });
      setSelectedMarketers(initialSelections);

    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketerSelect = (supplierId, marketerId) => {
    setSelectedMarketers(prev => ({
      ...prev,
      [supplierId]: marketerId
    }));
  };

  const handleAssignMarketer = async (supplierId) => {
    const marketerId = selectedMarketers[supplierId];
    if (!marketerId) {
      message.warning('Please select a marketer first');
      return;
    }

    try {
      setAssigning(true);
      await axios.post('/api/suppliers/assign-marketer', {
        supplierId,
        marketerId
      });
      message.success('Marketer assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning marketer:', error);
      message.error('Failed to assign marketer');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveMarketer = async (supplierId) => {
    try {
      setAssigning(true);
      await axios.delete(`/api/suppliers/remove-marketer/${supplierId}`);
      message.success('Marketer removed successfully');
      setSelectedMarketers(prev => {
        const newState = { ...prev };
        delete newState[supplierId];
        return newState;
      });
      fetchData();
    } catch (error) {
      console.error('Error removing marketer:', error);
      message.error('Failed to remove marketer');
    } finally {
      setAssigning(false);
    }
  };

  const suppliersByRegion = regions.map(region => ({
    ...region,
    suppliers: suppliers.filter(s => s.region_id === region.id)
  }));

  const filteredSuppliersByRegion = suppliersByRegion.map(region => ({
    ...region,
    suppliers: region.suppliers.filter(supplier =>
      supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.marketer && supplier.marketer.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }));

  const columns = [
    {
      title: 'Supplier',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text, record) => (
        <Space>
          <Avatar
            style={{
              backgroundColor: record.marketer ? '#87d068' : '#f56a00',
              transition: 'all 0.3s'
            }}
            size="large"
          >
            {text.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{text}</Text><br />
            <Text type="secondary">{record.contact_person}</Text>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.company_name.localeCompare(b.company_name)
    },
    {
      title: 'Current Marketer',
      dataIndex: 'marketer',
      key: 'marketer',
      render: (text, record) => (
        text ? (
          <Tag color="green" icon={<TeamOutlined />}>{text}</Tag>
        ) : (
          <Tag color="orange">Not Assigned</Tag>
        )
      )
    },
    {
      title: 'Assign Marketer',
      key: 'assign',
      render: (_, record) => (
        <Space size="middle">
          <Select
            style={{ width: 200 }}
            placeholder="Select marketer"
            value={selectedMarketers[record.id] || null}
            onChange={(value) => handleMarketerSelect(record.id, value)}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {marketers.map(marketer => (
              <Option key={marketer.user_id} value={marketer.user_id}>
                {marketer.first_name} {marketer.last_name}
              </Option>
            ))}
          </Select>

          {selectedMarketers[record.id] ? (
            record.marketer_id ? (
              <Space>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleAssignMarketer(record.id)}
                  loading={assigning}
                >
                  Update
                </Button>
                <Popconfirm
                  title="Remove this marketer?"
                  onConfirm={() => handleRemoveMarketer(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger>Remove</Button>
                </Popconfirm>
              </Space>
            ) : (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => handleAssignMarketer(record.id)}
                loading={assigning}
              >
                Assign
              </Button>
            )
          ) : null}
        </Space>
      )
    }
  ];

  if (loading && suppliers.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading suppliers and marketers..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Supplier Marketer Assignment</Title>}
        bordered={false}
        style={{
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(to right, #fafafa, #ffffff)'
        }}
        extra={
          <Search
            placeholder="Search suppliers"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
        }
      >
        <Tabs defaultActiveKey="all" type="card" size="large">
          <TabPane tab="All Suppliers" key="all">
            <Table
              columns={columns}
              dataSource={suppliers.filter(s =>
                s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.marketer && s.marketer.toLowerCase().includes(searchTerm.toLowerCase()))
              )}
              rowKey="id"
              loading={loading}
              scroll={{ x: true }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </TabPane>

          {filteredSuppliersByRegion.map(region => (
            <TabPane
              tab={
                <Badge
                  count={region.suppliers.length}
                  offset={[10, -5]}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {region.name}
                </Badge>
              }
              key={region.id}
            >
              <Table
                columns={columns}
                dataSource={region.suppliers}
                rowKey="id"
                loading={loading}
                scroll={{ x: true }}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                locale={{
                  emptyText: `No suppliers found in ${region.name} region`
                }}
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default SupplierMarketerAssignment;
