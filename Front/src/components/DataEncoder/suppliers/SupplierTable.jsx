// components/suppliers/SupplierTable.jsx
import React, { useState } from 'react';
import { Table, Tag, Badge, Dropdown, Menu, Space, Button } from 'antd';
import { 
  CheckOutlined, CloseOutlined, MoreOutlined, 
  PlusOutlined, FileExcelOutlined, ReloadOutlined
} from '@ant-design/icons';
import SupplierForm from './SupplierForm';
import JanitorCard from './JanitorCard';
import ActionButton from '../ui/ActionButton';
import { exportToExcel } from '../../../utils/exportToExcel';
import { useMediaQuery } from 'react-responsive';

const SupplierTable = ({ 
  suppliers, 
  regions, 
  loading, 
  searchText, 
  selectedRegion, 
  onRefresh 
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchText.toLowerCase()) ||
      supplier.phone.includes(searchText) ||
      supplier.location.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRegion = selectedRegion === 'all' || supplier.region_code === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  const columns = [
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 600 }}>{text}</span>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            {record.location}
          </div>
        </div>
      ),
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
    },
    ...(!isMobile ? [{
      title: 'Contact',
      dataIndex: 'contact_person',
      key: 'contact_person',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{record.phone}</div>
        </div>
      )
    }] : []),
    {
      title: 'Region',
      dataIndex: 'region_code',
      key: 'region',
      render: (code) => {
        const region = regions.find(r => r.code === code);
        return (
          <Tag 
            color={
              code === 'central' ? 'green' : 
              code === 'west' ? 'orange' : 
              code === 'south' ? 'blue' : 
              code === 'north' ? 'purple' : 'cyan'
            }
            style={{ borderRadius: 4 }}
          >
            {region?.name || code}
          </Tag>
        );
      }
    },
    {
      title: 'Janitors',
      dataIndex: 'janitors_count',
      key: 'janitors',
      render: (count) => (
        <Badge 
          count={count} 
          style={{ 
            backgroundColor: count > 0 ? '#10b981' : '#f97316',
            color: 'white'
          }}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item 
                key="edit" 
                icon={<CheckOutlined style={{ color: '#10b981' }} />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Menu.Item>
              <Menu.Item 
                key="delete" 
                icon={<CloseOutlined style={{ color: '#ef4444' }} />}
                onClick={() => handleDelete(record.id)}
              >
                Delete
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const handleAddNew = () => {
    setCurrentSupplier(null);
    setIsFormVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentSupplier(record);
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    // Delete logic here
  };

  const expandedRowRender = (record) => {
    return <JanitorCard supplier={record} />;
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <ActionButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            color="#10b981"
          >
            Add Supplier
          </ActionButton>
          <ActionButton
            type="default"
            icon={<FileExcelOutlined />}
            onClick={() => exportToExcel(filteredSuppliers, 'Suppliers')}
          >
            Export
          </ActionButton>
          <ActionButton
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredSuppliers}
        loading={loading}
        rowKey="id"
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpand: (expanded, record) => {
            if (expanded) {
              setExpandedRowKeys([...expandedRowKeys, record.id]);
            } else {
              setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
            }
          },
          expandIcon: ({ expanded, onExpand, record }) => (
            <Button
              type="text"
              size="small"
              onClick={e => onExpand(record, e)}
              style={{ marginRight: 8 }}
            >
              {expanded ? 'Hide' : 'View'} Janitors
            </Button>
          )
        }}
        scroll={{ x: true }}
      />

      <SupplierForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        supplier={currentSupplier}
        regions={regions}
        onSuccess={() => {
          setIsFormVisible(false);
          onRefresh();
        }}
      />
    </>
  );
};

export default SupplierTable;