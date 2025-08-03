// pages/SuppliersPage.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Space, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import AppLayout from '../layout/AppLayout';
import PageHeader from '../layout/PageHeader';
import SupplierTable from './SupplierTable';
import RegionFilter from './RegionFilter';
import SearchBar from './SearchBar';
import { fetchSuppliers, fetchRegions } from '../../../utils/api';
import CustomCard from '../ui/CustomCard';

const { Title } = Typography;

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [regionsData, suppliersData] = await Promise.all([
          fetchRegions(),
          fetchSuppliers()
        ]);
        setRegions(regionsData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title={
          <>
            <EnvironmentOutlined style={{ color: '#10b981', marginRight: 12 }} />
            <Title level={4} style={{ margin: 0 }}>Suppliersmnasbmcbasjhcbashcbaschb Management</Title>
          </>
        }
        extra={
          <Space>
            <RegionFilter 
              regions={regions} 
              selectedRegion={selectedRegion}
              onChange={setSelectedRegion}
            />
            <SearchBar 
              value={searchText}
              onChange={setSearchText}
            />
          </Space>
        }
      />
      
      <CustomCard>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <SupplierTable
              suppliers={suppliers}
              regions={regions}
              loading={loading}
              searchText={searchText}
              selectedRegion={selectedRegion}
              onRefresh={() => fetchSuppliers().then(setSuppliers)}
            />
          </Col>
        </Row>
      </CustomCard>
    </AppLayout>
  );
};

export default SuppliersPage;