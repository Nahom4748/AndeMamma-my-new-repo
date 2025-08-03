import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Input,
  Spin,
  Space,
  Select,
  Button,
  Popconfirm,
  message,
  Modal,
  List,
  Avatar,
  Row,
  Col,
  Descriptions,
  Badge,
  Tag,
  Divider
} from 'antd';
import { 
  SearchOutlined,
  EditOutlined,
  UserDeleteOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  CheckOutlined,
  ApartmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SupplierMarketerAssignment = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketers, setSelectedMarketers] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, marketersRes, sectorsRes] = await Promise.all([
        axios.get('http://localhost:5000/suppliers/marketer-assignments'),
        axios.get('http://localhost:5000/users?role=marketer'),
        axios.get('http://localhost:5000/sectors')
      ]);

      const supplierData = suppliersRes.data?.data || [];
      const marketerData = marketersRes.data?.data || [];
      const sectorData = sectorsRes.data?.data || [];

      // Filter only users with company_role_name = "Marketer" or user_id = 4
      const filteredMarketers = marketerData.filter(user => 
        user.company_role_name === "Marketer" || user.user_id === 4
      );

      setSuppliers(supplierData);
      setMarketers(filteredMarketers);
      setSectors(sectorData);

      // Initialize selected marketers
      const initialSelections = {};
      supplierData.forEach(supplier => {
        if (supplier.marketer_id) {
          initialSelections[supplier.supplier_id] = supplier.marketer_id;
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
      await axios.post('http://localhost:5000/suppliers/assign-marketer', {
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
      await axios.delete(`http://localhost:5000/suppliers/remove-marketer/${supplierId}`);
      message.success('Marketer removed successfully');
      
      setSelectedMarketers(prev => {
        const newState = {...prev};
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

  const showEditModal = (supplier) => {
    setCurrentSupplier(supplier);
    setEditModalVisible(true);
  };

  const showInfoModal = (supplier) => {
    setCurrentSupplier(supplier);
    setInfoModalVisible(true);
  };

  const handleEditAssign = (marketerId) => {
    setSelectedMarketers(prev => ({
      ...prev,
      [currentSupplier.supplier_id]: marketerId
    }));
    setEditModalVisible(false);
    handleAssignMarketer(currentSupplier.supplier_id);
  };

  // Filter suppliers based on assignment status
  const getFilteredSuppliers = (suppliersList) => {
    let filtered = suppliersList;
    
    // Filter by assignment status
    switch(filterAssigned) {
      case 'assigned':
        filtered = filtered.filter(s => s.marketer_id);
        break;
      case 'unassigned':
        filtered = filtered.filter(s => !s.marketer_id);
        break;
    }
    
    // Filter by sector
    if (selectedSector !== 'all') {
      filtered = filtered.filter(s => s.sector_id == selectedSector);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => {
        return (
          s.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.marketer_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    return filtered;
  };

  const columns = [
    {
      title: 'Supplier',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text, record) => (
        <div style={{ fontSize: '13px' }}>
          <Text strong style={{ display: 'block', marginBottom: '2px' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.contact_person}</Text>
        </div>
      ),
      sorter: (a, b) => a.company_name.localeCompare(b.company_name)
    },
    {
      title: 'Sector',
      dataIndex: 'sector_id',
      key: 'sector',
      render: (_, record) => {
        const sector = sectors.find(s => s.id === record.sector_id);
        return (
          <Tag 
            icon={<ApartmentOutlined />} 
            style={{ fontSize: '12px', padding: '2px 8px' }}
          >
            {sector?.name || 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Assigned Marketer',
      key: 'marketer',
      render: (_, record) => {
        return record.marketer_name ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size="small" 
              style={{ 
                backgroundColor: '#1890ff',
                marginRight: '8px',
                fontSize: '12px'
              }}
            >
              {record.marketer_name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Text style={{ fontSize: '13px' }}>{record.marketer_name}</Text>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>Not assigned</Text>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() => showInfoModal(record)}
            size="small"
            style={{ fontSize: '12px' }}
          />
          
          {record.marketer_id ? (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
                size="small"
                style={{ fontSize: '12px' }}
              />
              <Popconfirm
                title="Remove this marketer assignment?"
                onConfirm={() => handleRemoveMarketer(record.supplier_id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ size: 'small', danger: true }}
                cancelButtonProps={{ size: 'small' }}
              >
                <Button 
                  danger 
                  type="text"
                  icon={<UserDeleteOutlined />}
                  size="small"
                  style={{ fontSize: '12px' }}
                />
              </Popconfirm>
            </>
          ) : (
            <>
              <Select
                style={{ width: 160, fontSize: '12px' }}
                placeholder="Select marketer"
                value={selectedMarketers[record.supplier_id] || null}
                onChange={(value) => handleMarketerSelect(record.supplier_id, value)}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                size="small"
              >
                {marketers.map(marketer => (
                  <Option 
                    key={marketer.user_id} 
                    value={marketer.user_id}
                    style={{ fontSize: '12px' }}
                  >
                    {marketer.first_name} {marketer.last_name}
                  </Option>
                ))}
              </Select>
              
              {selectedMarketers[record.supplier_id] && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleAssignMarketer(record.supplier_id)}
                  loading={assigning}
                  size="small"
                  style={{ fontSize: '12px' }}
                />
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  if (loading && suppliers.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh'
      }}>
        <Spin size="large" tip="Loading suppliers and marketers..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Row justify="space-between" align="middle" gutter={16}>
            <Col>
              <Title level={5} style={{ margin: 0 }}>Supplier Marketer Assignment</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  value={filterAssigned}
                  onChange={setFilterAssigned}
                  size="small"
                  style={{ width: 150 }}
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="all">All Suppliers</Option>
                  <Option value="assigned">Assigned Only</Option>
                  <Option value="unassigned">Unassigned Only</Option>
                </Select>
                
                <Select
                  value={selectedSector}
                  onChange={setSelectedSector}
                  size="small"
                  style={{ width: 180 }}
                  placeholder="Filter by sector"
                  suffixIcon={<ApartmentOutlined />}
                >
                  <Option value="all">All Sectors</Option>
                  {sectors.map(sector => (
                    <Option key={sector.id} value={sector.id}>
                      {sector.name}
                    </Option>
                  ))}
                </Select>
                
                <Search
                  placeholder="Search suppliers..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="small"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 200 }}
                />
              </Space>
            </Col>
          </Row>
        }
        bordered={false}
        style={{
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <Table
          columns={columns}
          dataSource={getFilteredSuppliers(suppliers)}
          rowKey="supplier_id"
          loading={loading}
          scroll={{ x: true }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            size: 'small'
          }}
          size="small"
          style={{ fontSize: '12px' }}
          locale={{
            emptyText: (
              <div style={{ 
                padding: '24px 0',
                color: 'rgba(0, 0, 0, 0.25)',
                fontSize: '13px'
              }}>
                No suppliers found matching your criteria
              </div>
            )
          }}
        />
      </Card>

      {/* Edit Marketer Modal */}
      <Modal
        title={`Change Marketer for ${currentSupplier?.company_name}`}
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={marketers}
          renderItem={marketer => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleEditAssign(marketer.user_id)}
                >
                  Assign
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    size="large"
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {marketer.first_name.charAt(0)}{marketer.last_name.charAt(0)}
                  </Avatar>
                }
                title={`${marketer.first_name} ${marketer.last_name}`}
                description={
                  <Space>
                    <Tag color="blue">Marketer</Tag>
                    <Text type="secondary">{marketer.email}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Supplier Info Modal */}
      <Modal
        title={`Supplier Details: ${currentSupplier?.company_name}`}
        visible={infoModalVisible}
        onCancel={() => setInfoModalVisible(false)}
        footer={null}
        width={700}
      >
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Company Name">
            {currentSupplier?.company_name}
          </Descriptions.Item>
          <Descriptions.Item label="Contact Person">
            {currentSupplier?.contact_person}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {currentSupplier?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            {currentSupplier?.location}
          </Descriptions.Item>
          <Descriptions.Item label="Sector">
            {currentSupplier?.sector_id ? (
              <Tag icon={<ApartmentOutlined />}>
                {sectors.find(s => s.id === currentSupplier.sector_id)?.name || 'N/A'}
              </Tag>
            ) : (
              <Text type="secondary">Not assigned</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned Marketer">
            {currentSupplier?.marketer_name ? (
              <Space>
                <Avatar 
                  size="small" 
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {currentSupplier.marketer_name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Text>{currentSupplier.marketer_name}</Text>
              </Space>
            ) : (
              <Text type="secondary">Not assigned</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default SupplierMarketerAssignment;