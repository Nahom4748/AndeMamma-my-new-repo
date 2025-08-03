// components/suppliers/SupplierForm.jsx
import React from 'react';
import { Form, Input, Select, Button, Modal, Divider, Card, Row, Col } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import ActionButton from '../ui/ActionButton';

const { Option } = Select;

const SupplierForm = ({ visible, onClose, supplier, regions, onSuccess }) => {
  const [form] = Form.useForm();
  const isEditMode = !!supplier;

  React.useEffect(() => {
    if (supplier) {
      form.setFieldsValue({
        company_name: supplier.company_name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        location: supplier.location,
        region_code: supplier.region_code,
        janitors: supplier.janitors || []
      });
    } else {
      form.resetFields();
    }
  }, [supplier, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      // API call would go here
      onSuccess();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEditMode ? "Edit Supplier" : "Add New Supplier"}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <ActionButton
          key="submit"
          type="primary"
          onClick={handleSubmit}
          color="#10b981"
        >
          {isEditMode ? "Update" : "Add"}
        </ActionButton>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="company_name"
              label="Company Name"
              rules={[{ required: true, message: 'Please input company name!' }]}
            >
              <Input placeholder="Enter company name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contact_person"
              label="Contact Person"
              rules={[{ required: true, message: 'Please input contact person!' }]}
            >
              <Input placeholder="Enter contact person" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ 
                required: true, 
                message: 'Please input phone number!' 
              }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please input location!' }]}
            >
              <Input placeholder="Enter location" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="region_code"
              label="Region"
              rules={[{ required: true, message: 'Please select region!' }]}
            >
              <Select placeholder="Select region">
                {regions.map(region => (
                  <Option key={region.code} value={region.code}>
                    {region.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Divider orientation="left">
          <TeamOutlined style={{ color: '#10b981', marginRight: 8 }} />
          Janitors Information
        </Divider>
        
        <Form.List name="janitors">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card 
                  key={key} 
                  size="small" 
                  style={{ 
                    marginBottom: 16,
                    borderColor: '#d1fae5',
                    borderRadius: 8
                  }}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="Janitor Name"
                        rules={[{ required: true, message: 'Please input name!' }]}
                      >
                        <Input placeholder="Name" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'phone']}
                        label="Phone"
                        rules={[{ required: true, message: 'Please input phone!' }]}
                      >
                        <Input placeholder="Phone" />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, 'account']}
                        label="Account"
                        rules={[{ required: true, message: 'Please input account!' }]}
                      >
                        <Input placeholder="Account details" />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <Button
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => remove(name)}
                        style={{ float: 'right' }}
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
                  style={{ 
                    color: '#10b981',
                    borderColor: '#10b981',
                    borderRadius: 8
                  }}
                >
                  Add Janitor
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default SupplierForm;