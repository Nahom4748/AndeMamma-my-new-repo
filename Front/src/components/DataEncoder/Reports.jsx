import React, { useEffect, useState } from 'react';
import { 
  DatePicker, 
  Select, 
  Card, 
  Table, 
  Spin, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Empty, 
  Space, 
  message,
  Alert 
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import { DownloadOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const PaperCollectionReport = () => {
  const [data, setData] = useState([]);
  const [region, setRegion] = useState('all');
  const [dates, setDates] = useState([dayjs().startOf('month'), dayjs().endOf('day')]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [regions, setRegions] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // Check mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch regions and initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regionsRes] = await Promise.all([
          axios.get('http://localhost:5000/regions'),
          fetchReport(true)
        ]);
        setRegions(regionsRes.data.data);
        setError(null);
      } catch (error) {
        console.error('Initialization error:', error);
        setError('No Data Found with this range.');
      } finally {
        setInitialLoad(false);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch report when filters change
  useEffect(() => {
    if (!initialLoad) {
      const timer = setTimeout(() => {
        fetchReport();
      }, 500); // Debounce to avoid rapid requests
      return () => clearTimeout(timer);
    }
  }, [dates, region]);

  const fetchReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const res = await axios.get('http://localhost:5000/api/reports/summarydata', {
        params: {
          startDate: dates[0].format('YYYY-MM-DD'),
          endDate: dates[1].format('YYYY-MM-DD'),
          region
        }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to load report data. Please check your connection and try again.');
      setData([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      message.warning('No data to export');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `paper_collection_${region}_${dates[0].format('MM-YYYY')}.xlsx`);
  };

  const handleResetFilters = () => {
    setRegion('all');
    setDates([dayjs().startOf('month'), dayjs().endOf('day')]);
  };

  const handleDateChange = (values) => {
    if (values && values.length === 2) {
      setDates(values);
    } else {
      // If date picker is cleared, reset to default (current month)
      setDates([dayjs().startOf('month'), dayjs().endOf('day')]);
    }
  };

  // Chart configurations
  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: isMobile,
        columnWidth: '60%',
        distributed: true,
      }
    },
    dataLabels: {
      enabled: !isMobile,
      style: { fontSize: '12px', colors: ['#111827'] },
      formatter: (val) => `${val} kg`,
    },
    xaxis: {
      categories: data.map(d => d.type),
      labels: { 
        style: { 
          colors: '#6B7280', 
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        } 
      },
    },
    yaxis: {
      labels: { 
        style: { colors: '#6B7280', fontSize: '12px' },
        formatter: (val) => `${val} kg`
      },
    },
    tooltip: {
      theme: 'light',
      style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
      y: { formatter: (val) => `${val} kg` }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 4,
    },
    noData: {
      text: 'No data available',
      align: 'center',
      verticalAlign: 'middle',
    }
  };

  const chartSeries = [{ name: 'Total KG', data: data.map(d => d.total_kg) }];

  const pieOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Inter, sans-serif',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    labels: data.map(d => d.type),
    legend: { 
      position: isMobile ? 'bottom' : 'right',
      fontSize: '14px',
      horizontalAlign: 'center',
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    dataLabels: { style: { fontSize: '12px' } },
    tooltip: {
      y: { formatter: (val) => `${val} kg` }
    },
    noData: {
      text: 'No data available',
      align: 'center',
      verticalAlign: 'middle',
    }
  };

  const renderRegionTag = () => {
    if (region === 'all') return <Tag color="blue">All Regions</Tag>;
    const regionName = regions.find(r => r.code === region)?.name || region;
    return <Tag color="geekblue">{regionName}</Tag>;
  };

  const renderDateRange = () => {
    if (dates[0].isSame(dayjs().startOf('month')) && dates[1].isSame(dayjs().endOf('day'))) {
      return <Tag color="green">Current Month</Tag>;
    }
    return <Tag color="cyan">{dates[0].format('MMM D')} - {dates[1].format('MMM D, YYYY')}</Tag>;
  };

  const isCurrentMonth = dates[0].isSame(dayjs().startOf('month')) && 
                        dates[1].isSame(dayjs().endOf('day'));

  const hasNoData = !loading && data.length === 0 && !error;
  const dateRangeLabel = `${dates[0].format('MMM D, YYYY')} to ${dates[1].format('MMM D, YYYY')}`;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <Card 
        title={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>Paper Collection Report</Title>
            <Space size="small">
              {renderRegionTag()}
              {renderDateRange()}
            </Space>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<FilterOutlined />}
              onClick={handleResetFilters}
              disabled={isCurrentMonth && region === 'all'}
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={data.length === 0}
            >
              {isMobile ? 'Export' : 'Export Excel'}
            </Button>
          </Space>
        }
        bordered={false}
        style={{ 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          minHeight: '80vh'
        }}
      >
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Date Range</Text>
              <RangePicker 
                value={dates}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                allowClear={false}
                presets={[
                  { label: 'Today', value: [dayjs(), dayjs()] },
                  { label: 'This Week', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Region</Text>
              <Select
                value={region}
                onChange={setRegion}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: 'All Regions' },
                  ...regions.map(r => ({ value: r.code, label: r.name }))
                ]}
                loading={initialLoad}
              />
            </Space>
          </Col>
          <Col xs={24} sm={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              type="default" 
              icon={<ReloadOutlined />}
              onClick={() => fetchReport()}
              loading={loading}
              style={{ width: '100%' }}
            >
              Refresh Data
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>Loading collection data...</Text>
          </div>
        ) : hasNoData ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Text>No paper collection data found for</Text>
                <Space>
                  {renderRegionTag()}
                  <Text>{dateRangeLabel}</Text>
                </Space>
              </Space>
            }
            style={{ padding: '80px 0' }}
          >
            <Button 
              type="primary" 
              onClick={handleResetFilters}
            >
              Show Current Month Data
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={14}>
                <Card 
                  title={`Collection by Paper Type (KG) - ${dateRangeLabel}`} 
                  bordered={false}
                  style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
                >
                  <Chart 
                    options={chartOptions} 
                    series={chartSeries} 
                    type="bar" 
                    height={350} 
                    width="100%"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card 
                  title="Distribution by Type" 
                  bordered={false}
                  style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
                >
                  <Chart 
                    options={pieOptions} 
                    series={data.map(d => d.total_kg)} 
                    type="pie" 
                    height={350} 
                    width="100%"
                  />
                </Card>
              </Col>
            </Row>

            <Card 
              title={`Detailed Collection Data - ${dateRangeLabel}`}
              bordered={false}
              style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
            >
              <Table
                dataSource={data}
                columns={[
                  { 
                    title: 'Paper Type', 
                    dataIndex: 'type',
                    render: (text) => <Text strong>{text}</Text>,
                    sorter: (a, b) => a.type.localeCompare(b.type)
                  },
                  { 
                    title: 'Total KG', 
                    dataIndex: 'total_kg',
                    render: (text) => <Text>{text} kg</Text>,
                    sorter: (a, b) => a.total_kg - b.total_kg,
                    defaultSortOrder: 'descend'
                  },
                  { 
                    title: 'Region', 
                    dataIndex: 'region_name',
                    render: (text) => <Tag>{text || 'All Regions'}</Tag>,
                    filters: regions.map(r => ({ text: r.name, value: r.name })),
                    onFilter: (value, record) => record.region_name === value,
                  }
                ]}
                rowKey="type"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                  hideOnSinglePage: true
                }}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: true }}
              />
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaperCollectionReport;