import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Form, Input, Select, Button, Table, Typography,
  InputNumber, message, Divider
} from 'antd';
import {
  SaveOutlined, PlusOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;

const DailyCollection = () => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [janitors, setJanitors] = useState([]);
  const [collectionTypes, setCollectionTypes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedJanitor, setSelectedJanitor] = useState(null);
  const [selectedCollectionType, setSelectedCollectionType] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);

  const [customDate, setCustomDate] = useState(moment().format('YYYY-MM-DD'));

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [suppliersRes, collectionTypesRes, paperTypesRes, driversRes, coordinatorsRes] = await Promise.all([
          axios.get('http://localhost:5000/suppliers'),
          axios.get('http://localhost:5000/collectionstype'),
          axios.get('http://localhost:5000/papertypes'),
          axios.get('http://localhost:5000/drivers'),
          axios.get('http://localhost:5000/coordinators')
        ]);

        setSuppliers(suppliersRes.data?.data || []);
        setCollectionTypes(collectionTypesRes.data?.data || []);
        setPaperTypes(paperTypesRes.data?.data || []);
        setDrivers(driversRes.data?.data || []);
                setCoordinators(coordinatorsRes.data?.data || []);
      } catch (err) {
        message.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId) || null;
    setSelectedSupplier(supplier);
    setJanitors(supplier?.janitors || []);
    setSelectedJanitor(null);
    form.setFieldsValue({ janitor_id: null });
  };

  const handleCollectionTypeChange = (typeId) => {
    setSelectedCollectionType(typeId);
  };

  const addCollectionItem = () => {
    setCollectionItems(prev => [...prev, { key: Date.now(), paper_type_id: null, bag_count: null, kg: null }]);
  };

  const removeCollectionItem = (key) => {
    setCollectionItems(prev => prev.filter(item => item.key !== key));
  };

  const updateCollectionItem = (key, field, value) => {
    setCollectionItems(prev =>
      prev.map(item => item.key === key ? { ...item, [field]: value } : item)
    );
  };

  const totalKg = collectionItems.reduce((acc, item) => acc + (item.kg || 0), 0);
  const totalBags = collectionItems.reduce((acc, item) => acc + (item.bag_count || 0), 0);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (collectionItems.length === 0) {
        message.error('Please add at least one collection item');
        return;
      }

      if (!selectedJanitor) {
        message.error('Please select a janitor');
        return;
      }

      setLoading(true);

      const collectionData = {
        organization_id: values.supplier_id,
        collection_type_id: values.collection_type_id,
        driver_id: values.driver_id,
        collection_date: customDate,
        collection_coordinator_id: values.collection_coordinator_id || null,
        total_kg: totalKg,
        total_bag: totalBags,
        janitor_id: selectedJanitor,
        items: collectionItems.map(item => ({
          paper_type_id: item.paper_type_id,
          bag_count: item.bag_count,
          kg: item.kg,
        })),
      };

      await axios.post('http://localhost:5000/collections', collectionData);
      message.success('Collection saved successfully!');

      form.resetFields();
      setCollectionItems([]);
      setSelectedSupplier(null);
      setSelectedJanitor(null);
      setSelectedCollectionType(null);
      setJanitors([]);
      setCustomDate(moment().format('YYYY-MM-DD'));
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const collectionItemColumns = [
    {
      title: 'Paper Type',
      dataIndex: 'paper_type_id',
      key: 'paper_type_id',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select paper type"
          value={record.paper_type_id}
          onChange={(value) => updateCollectionItem(record.key, 'paper_type_id', value)}
        >
          {paperTypes.map(pt => (
            <Option key={pt.id} value={pt.id}>
              {pt.description} ({pt.code})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Bags',
      dataIndex: 'bag_count',
      key: 'bag_count',
      render: (_, record) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          placeholder="Bags"
          value={record.bag_count}
          onChange={(value) => updateCollectionItem(record.key, 'bag_count', value)}
        />
      ),
    },
    {
      title: 'KG',
      dataIndex: 'kg',
      key: 'kg',
      render: (_, record) => (
        <InputNumber
          min={0}
          step={0.1}
          style={{ width: '100%' }}
          placeholder="KG"
          value={record.kg}
          onChange={(value) => updateCollectionItem(record.key, 'kg', value)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => removeCollectionItem(record.key)}
        />
      ),
    },
  ];

  const handleCustomDateChange = (e) => {
    const val = e.target.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setCustomDate(val);
    } else if (val === '') {
      setCustomDate('');
    }
  };

  return (
    <Card
      title={<Text strong style={{ color: '#52c41a', fontSize: '18px' }}>Daily Waste Collection</Text>}
      loading={loading}
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          disabled={!selectedSupplier || collectionItems.length === 0 || !customDate}
        >
          Save Collection
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="supplier_id"
              label="Supplier/Organization"
              rules={[{ required: true, message: 'Please select supplier' }]}
            >
              <Select
                showSearch
                placeholder="Select supplier"
                optionFilterProp="label"
                onChange={handleSupplierChange}
                allowClear
              >
                {suppliers.map(supplier => (
                  <Option
                    key={supplier.id}
                    value={supplier.id}
                    label={`${supplier.company_name} - ${supplier.location}`}
                  >
                    {supplier.company_name} - {supplier.location}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedSupplier && (
              <>
                <Form.Item
                  name="janitor_id"
                  label="Janitor"
                  rules={[{ required: true, message: 'Please select janitor' }]}
                >
                  <Select
                    placeholder="Select janitor"
                    value={selectedJanitor}
                    onChange={setSelectedJanitor}
                    allowClear
                  >
                    {janitors.map(janitor => (
                      <Option key={janitor.id} value={janitor.id}>
                        {janitor.name} ({janitor.phone})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Text strong>Supplier Information:</Text>
                <div style={{ marginBottom: 16 }}>
                  <Text>Contact: {selectedSupplier.contact_person}</Text><br />
                  <Text>Phone: {selectedSupplier.phone}</Text><br />
                  <Text>Location: {selectedSupplier.location}</Text>
                </div>
              </>
            )}
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={<Text strong style={{ color: '#52c41a' }}>Collection Date</Text>}
              required
              validateStatus={!customDate ? 'error' : ''}
              help={!customDate ? 'Please select a valid date (YYYY-MM-DD)' : ''}
            >
              <input
                type="date"
                value={customDate}
                onChange={handleCustomDateChange}
                className="bg-gray-50 border border-green-600 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full pl-3 p-2.5"
                placeholder="Select date"
              />
            </Form.Item>

            <Form.Item
              name="collection_type_id"
              label="Collection Type"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select 
                placeholder="Select collection type" 
                allowClear
                onChange={handleCollectionTypeChange}
              >
                {collectionTypes.map(ct => (
                  <Option key={ct.id} value={ct.id}>{ct.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="driver_id" 
              label="Driver"
              rules={[{ required: true, message: 'Please select driver' }]}
            >
              <Select placeholder="Select driver">
                {drivers.map(driver => (
                  <Option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedCollectionType && 
              collectionTypes.find(ct => ct.id === selectedCollectionType)?.name.toLowerCase() === 'instore' && (
              <Form.Item
                name="collection_coordinator_id"
                label="Collection Coordinator"
                rules={[{ required: true, message: 'Please select coordinator' }]}
              >
                <Select placeholder="Select coordinator" allowClear>
                  {coordinators.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Col>
        </Row>

        <Divider orientation="left">Collection Items</Divider>

        <Table
          columns={collectionItemColumns}
          dataSource={collectionItems}
          pagination={false}
          size="small"
          rowKey="key"
          footer={() => (
            <div style={{ textAlign: 'right' }}>
              <Text strong>Total Bags: {totalBags}</Text>
              <Text strong style={{ marginLeft: 16 }}>
                Total KG: {totalKg.toFixed(2)}
              </Text>
            </div>
          )}
        />

        <Button
          type="dashed"
          onClick={addCollectionItem}
          icon={<PlusOutlined />}
          style={{ marginTop: 16 }}
        >
          Add Paper Type
        </Button>
      </Form>
    </Card>
  );
};

export default DailyCollection;
