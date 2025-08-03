import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Space, Typography, Tag, Modal, Form, message,
  Row, Col, Select, Avatar, Card, Badge, Descriptions, List, Tabs,
  Divider, Popconfirm, theme, Grid, Popover, Tooltip
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, FileExcelOutlined,
  EnvironmentOutlined, TeamOutlined, UserOutlined, PhoneOutlined,
  BankOutlined, ContactsOutlined, CloseOutlined,
  DeleteOutlined, ApartmentOutlined, FilterOutlined, MoreOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { useToken } = theme;

const SuppliersManagement = () => {
  const { token } = useToken();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState({});

  const isMobile = !screens.md;

  // Color scheme
  const colors = {
    primary: '#10b981',
    primaryLight: '#d1fae5',
    primaryLighter: '#ecfdf5',
    primaryDark: '#059669',
    textPrimary: token.colorTextHeading,
    textSecondary: token.colorTextSecondary,
    border: token.colorBorderSecondary,
    background: token.colorBgContainer,
    error: token.colorError
  };

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [regionsRes, suppliersRes, sectorsRes] = await Promise.all([
          axios.get('http://localhost:5000/regions'),
          axios.get('http://localhost:5000/suppliers'),
          axios.get('http://localhost:5000/sectors')
        ]);

        setRegions(regionsRes.data.data || []);
        
        const sectorsData = sectorsRes.data.data || [];
        setSectors(sectorsData);

        const suppliersData = suppliersRes.data.data || [];
        setSuppliers(suppliersData.map(supplier => ({
          ...supplier,
          sector_id: supplier.sector_code,
          sector_name: sectorsData.find(s => s.code === supplier.sector_code)?.name || supplier.sector_name
        })));
      } catch (err) {
        message.error(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Supplier operations
  const handleDelete = async (supplierId) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/suppliers/${supplierId}`);
      setSuppliers(suppliers.filter(s => s.id !== supplierId));
      message.success('Supplier deleted successfully');
      setPopoverVisible({...popoverVisible, [supplierId]: false});
    } catch (err) {
      message.error(`Failed to delete supplier: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text, record) => (
        <div 
          onClick={() => showSupplierDetails(record)} 
          className="cursor-pointer hover:bg-gray-50 p-2 rounded"
        >
          <Text strong style={{ color: colors.textPrimary }}>{text}</Text>
          <div className="flex items-center mt-1">
            <EnvironmentOutlined className="text-emerald-600 mr-1" />
            <Text type="secondary" className="text-sm">{record.location}</Text>
          </div>
        </div>
      ),
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
    },
    ...(!isMobile ? [
      {
        title: 'Contact',
        dataIndex: 'contact_person',
        key: 'contact_person',
        render: (text, record) => (
          <div 
            onClick={() => showSupplierDetails(record)} 
            className="cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            <div className="flex items-center">
              <UserOutlined className="text-emerald-600 mr-2" />
              <Text>{text}</Text>
            </div>
            <div className="flex items-center mt-1">
              <PhoneOutlined className="text-emerald-600 mr-2" />
              <Text type="secondary" className="text-sm">{record.phone}</Text>
            </div>
          </div>
        ),
      }
    ] : []),
    {
      title: 'Region',
      dataIndex: 'region_code',
      key: 'region',
      responsive: ['md'],
      render: (code) => {
        const region = regions.find(r => r.code === code);
        return (
          <Tag 
            color={colors.primary} 
            className="font-medium rounded-md"
          >
            {region?.name || code}
          </Tag>
        );
      },
    },
    {
      title: 'Sector',
      dataIndex: 'sector_id',
      key: 'sector',
      responsive: ['md'],
      render: (code, record) => {
        const sector = sectors.find(s => s.code === code);
        return (
          <Tag 
            color={colors.primaryDark} 
            className="font-medium rounded-md flex items-center"
          >
            <ApartmentOutlined className="mr-1" />
            {sector?.name || record.sector_name || 'N/A'}
          </Tag>
        );
      },
    },
    {
      title: 'Janitors',
      dataIndex: 'janitors',
      key: 'janitors',
      responsive: ['sm'],
      render: (janitors, record) => {
        const count = Array.isArray(janitors) ? janitors.length : 0;
        return (
          <Badge
            count={count}
            className="cursor-pointer"
            style={{
              backgroundColor: count > 0 ? colors.primary : colors.error,
            }}
            onClick={() => showSupplierDetails(record)}
          >
            <Button
              type="text"
              icon={<TeamOutlined />}
              className="p-0"
              style={{
                color: count > 0 ? colors.primary : colors.error,
                fontWeight: 500
              }}
            />
          </Badge>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Popover
          content={
            <div className="flex flex-col space-y-2 p-1">
              <Tooltip title="Edit supplier">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                    setPopoverVisible({...popoverVisible, [record.id]: false});
                  }}
                  className="text-emerald-600 hover:bg-emerald-50 w-full text-left"
                >
                  Edit
                </Button>
              </Tooltip>
              <Popconfirm
                title="Delete this supplier?"
                description="Are you sure you want to delete this supplier?"
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDelete(record.id);
                }}
                onCancel={(e) => e.stopPropagation()}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' }}
              >
                <Tooltip title="Delete supplier">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-left hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Popconfirm>
            </div>
          }
          trigger="click"
          open={popoverVisible[record.id]}
          onOpenChange={(visible) => setPopoverVisible({...popoverVisible, [record.id]: visible})}
          placement="bottomRight"
          overlayClassName="action-popover"
        >
          <Button
            type="text"
            shape="circle"
            icon={<MoreOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setPopoverVisible({...popoverVisible, [record.id]: true});
            }}
            className="hover:bg-gray-100"
          />
        </Popover>
      ),
    },
  ];

  const showSupplierDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailVisible(true);
  };

  const handleAdd = () => {
    setEditMode(false);
    setCurrentSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (supplier) => {
    setEditMode(true);
    setCurrentSupplier(supplier);
    form.setFieldsValue({
      ...supplier,
      sector_id: supplier.sector_code,
      janitors: supplier.janitors || []
    });
    setIsModalVisible(true);
  };

  const exportToExcel = () => {
    const exportData = suppliers.map(supplier => {
      const region = regions.find(r => r.code === supplier.region_code);
      const sector = sectors.find(s => s.code === supplier.sector_code);
      
      const baseData = {
        'Company Name': supplier.company_name,
        'Contact Person': supplier.contact_person,
        'Phone': supplier.phone,
        'Location': supplier.location,
        'Region': region?.name || supplier.region_code,
        'Sector': sector?.name || supplier.sector_name || 'N/A'
      };

      if (supplier.janitors && supplier.janitors.length > 0) {
        return supplier.janitors.map(janitor => ({
          ...baseData,
          'Janitor Name': janitor.name,
          'Janitor Phone': janitor.phone,
          'Janitor Account': janitor.account || 'N/A'
        }));
      }
      return {
        ...baseData,
        'Janitor Name': 'N/A',
        'Janitor Phone': 'N/A',
        'Janitor Account': 'N/A'
      };
    }).flat();

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "Suppliers_Report.xlsx");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const janitorsData = values.janitors?.map(j => ({
        ...(j.id ? { id: j.id } : {}),
        name: j.name,
        phone: j.phone,
        account: j.account
      })) || [];

      const supplierData = {
        company_name: values.company_name,
        contact_person: values.contact_person,
        phone: values.phone,
        location: values.location,
        region_code: values.region_code,
        sector_code: values.sector_id,
        janitors: janitorsData
      };

      if (editMode) {
        const res = await axios.put(`http://localhost:5000/suppliers/${currentSupplier.id}`, supplierData);
        const updatedSupplier = res.data.data;
        setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? {
          ...updatedSupplier,
          sector_id: updatedSupplier.sector_code,
          sector_name: sectors.find(sec => sec.code === updatedSupplier.sector_code)?.name || updatedSupplier.sector_name
        } : s));
        message.success('Supplier updated successfully');
      } else {
        const res = await axios.post('http://localhost:5000/suppliers', supplierData);
        setSuppliers([...suppliers, {
          ...res.data.data,
          sector_id: res.data.data.sector_code,
          sector_name: sectors.find(sec => sec.code === res.data.data.sector_code)?.name || res.data.data.sector_name
        }]);
        message.success('Supplier added successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setCurrentSupplier(null);
      setEditMode(false);
    } catch (err) {
      message.error(`Failed to save supplier: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchText.toLowerCase()) ||
      supplier.phone?.includes(searchText);
    const matchesRegion = selectedRegion === 'all' || supplier.region_code === selectedRegion;
    const matchesSector = selectedSector === 'all' || supplier.sector_code === selectedSector;
    return matchesSearch && matchesRegion && matchesSector;
  });

  const renderSupplierDetails = () => {
    if (!selectedSupplier) return null;
    const { janitors = [] } = selectedSupplier;
    const region = regions.find(r => r.code === selectedSupplier.region_code);
    const sector = sectors.find(s => s.code === selectedSupplier.sector_code);
    
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <BankOutlined className="text-emerald-600 text-2xl mr-3" />
            <Title level={3} className="m-0 text-gray-800">{selectedSupplier.company_name}</Title>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setIsDetailVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>
        
        <Tabs defaultActiveKey="1" className="supplier-tabs">
          <TabPane 
            tab={
              <span className="flex items-center">
                <ContactsOutlined className="mr-1" />
                Supplier Info
              </span>
            } 
            key="1"
          >
            <Card className="bg-emerald-50 border-emerald-100 rounded-lg">
              <Descriptions column={isMobile ? 1 : 2} className="supplier-descriptions">
                <Descriptions.Item label="Company Name">
                  <div className="flex items-center">
                    <BankOutlined className="text-emerald-600 mr-2" />
                    <Text strong>{selectedSupplier.company_name}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  <div className="flex items-center">
                    <EnvironmentOutlined className="text-emerald-600 mr-2" />
                    {selectedSupplier.location}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Region">
                  <Tag color={colors.primary} className="font-medium rounded-md">
                    {region?.name || selectedSupplier.region_code}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Sector">
                  <Tag color={colors.primaryDark} className="font-medium rounded-md flex items-center">
                    <ApartmentOutlined className="mr-1" />
                    {sector?.name || selectedSupplier.sector_name || 'N/A'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Contact Person">
                  <div className="flex items-center">
                    <UserOutlined className="text-emerald-600 mr-2" />
                    {selectedSupplier.contact_person}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  <div className="flex items-center">
                    <PhoneOutlined className="text-emerald-600 mr-2" />
                    {selectedSupplier.phone}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane 
            tab={
              <span className="flex items-center">
                <TeamOutlined className="mr-1" />
                Janitors ({janitors.length})
              </span>
            } 
            key="2"
          >
            {janitors.length > 0 ? (
              <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={janitors}
                renderItem={janitor => (
                  <List.Item>
                    <Card className="border-emerald-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center p-2">
                        <Avatar
                          size={48}
                          icon={<UserOutlined />}
                          className="bg-emerald-600 text-white mr-4"
                        />
                        <div>
                          <Text strong className="text-lg text-gray-800">{janitor.name}</Text>
                          <div className="flex items-center mt-1">
                            <PhoneOutlined className="text-emerald-600 mr-2" />
                            <Text type="secondary">{janitor.phone}</Text>
                          </div>
                          <div className="mt-1">
                            <Text strong className="text-gray-800">Account:</Text> {janitor.account || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Card className="text-center border-emerald-100 bg-emerald-50">
                <TeamOutlined className="text-4xl text-emerald-300 mb-3" />
                <Title level={5} className="text-gray-500">No Janitors Assigned</Title>
              </Card>
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  };

  const renderForm = () => (
    <Form form={form} layout="vertical" className="supplier-form">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="Enter company name" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter location' }]}
          >
            <Input placeholder="Enter location" className="rounded-md" />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="region_code"
            label="Region"
            rules={[{ required: true, message: 'Please select region' }]}
          >
            <Select 
              placeholder="Select region"
              className="rounded-md"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {regions.map(region => (
                <Option key={region.code} value={region.code}>
                  {region.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="sector_id"
            label="Sector"
            rules={[{ required: true, message: 'Please select sector' }]}
          >
            <Select 
              placeholder="Select sector"
              className="rounded-md"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {sectors.map(sector => (
                <Option key={sector.code} value={sector.code}>
                  {sector.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="contact_person"
            label="Contact Person"
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input placeholder="Enter contact person" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" className="rounded-md" />
          </Form.Item>
        </Col>
      </Row>
      
      <Divider orientation="left" className="text-emerald-600 font-medium">
        <TeamOutlined className="mr-2" />
        Janitors Information
      </Divider>
      
      <Form.List name="janitors">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={key}
                size="small"
                className="mb-4 border-emerald-100 bg-emerald-50 rounded-lg"
              >
                <Row gutter={16} align="middle">
                  <Col xs={24} md={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="Name"
                      rules={[{ required: true, message: 'Please enter name' }]}
                    >
                      <Input placeholder="Janitor name" className="rounded-md" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'phone']}
                      label="Phone"
                      rules={[{ required: true, message: 'Please enter phone' }]}
                    >
                      <Input placeholder="Phone number" className="rounded-md" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={7}>
                    <Form.Item
                      {...restField}
                      name={[name, 'account']}
                      label="Account"
                    >
                      <Input placeholder="Account details" className="rounded-md" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={1}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      className="float-right"
                    />
                  </Col>
                </Row>
              </Card>
            ))}
            
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                className="border-emerald-600 text-emerald-600 hover:border-emerald-700 hover:text-emerald-700 rounded-md"
              >
                Add Janitor
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Card
        className="rounded-xl shadow-sm border-0"
        title={
          <div className="flex items-center">
            <div className="bg-emerald-600 p-2 rounded-lg mr-3">
              <BankOutlined className="text-white text-xl" />
            </div>
            <div>
              <Title level={4} className="m-0 text-gray-800">Suppliers Management</Title>
              <Text type="secondary" className="text-sm">Manage your suppliers and janitors</Text>
            </div>
          </div>
        }
        extra={
          <Space>
            <Tooltip title="Add new supplier">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                {!isMobile && 'Add Supplier'}
              </Button>
            </Tooltip>
            
            <Tooltip title="Export to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              >
                {!isMobile && 'Export'}
              </Button>
            </Tooltip>
            
            {isMobile && (
              <Tooltip title="Toggle filters">
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterVisible(!filterVisible)}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                />
              </Tooltip>
            )}
          </Space>
        }
      >
        <div className="mb-6">
          <Row gutter={16}>
            <Col xs={24} md={filterVisible ? 24 : 8} lg={filterVisible ? 8 : 8}>
              <Input
                placeholder="Search suppliers..."
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="rounded-md"
              />
            </Col>
            
            {(!isMobile || filterVisible) && (
              <>
                <Col xs={24} md={8} lg={8}>
                  <Select
                    value={selectedRegion}
                    onChange={setSelectedRegion}
                    placeholder="Filter by region"
                    allowClear
                    className="w-full rounded-md"
                  >
                    <Option value="all">All Regions</Option>
                    {regions.map(region => (
                      <Option key={region.code} value={region.code}>
                        {region.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
                
                <Col xs={24} md={8} lg={8}>
                  <Select
                    value={selectedSector}
                    onChange={setSelectedSector}
                    placeholder="Filter by sector"
                    allowClear
                    className="w-full rounded-md"
                  >
                    <Option value="all">All Sectors</Option>
                    {sectors.map(sector => (
                      <Option key={sector.code} value={sector.code}>
                        {sector.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </>
            )}
          </Row>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} suppliers`,
          }}
          className="rounded-lg"
          scroll={{ x: true }}
          onRow={(record) => ({
            onClick: () => showSupplierDetails(record),
            className: 'cursor-pointer hover:bg-gray-50'
          })}
        />
      </Card>
      
      <Modal
        title={
          <div className="flex items-center">
            {editMode ? (
              <>
                <EditOutlined className="text-emerald-600 mr-2" />
                <span className="text-gray-800">Edit Supplier</span>
              </>
            ) : (
              <>
                <PlusOutlined className="text-emerald-600 mr-2" />
                <span className="text-gray-800">Add New Supplier</span>
              </>
            )}
          </div>
        }
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={isMobile ? '90%' : 700}
        okText={editMode ? 'Update' : 'Add'}
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' }}
        cancelButtonProps={{ className: 'hover:bg-gray-100' }}
      >
        {renderForm()}
      </Modal>
      
      <Modal
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={null}
        width={isMobile ? '90%' : 700}
        className="supplier-detail-modal"
      >
        {renderSupplierDetails()}
      </Modal>
    </div>
  );
};

export default SuppliersManagement;