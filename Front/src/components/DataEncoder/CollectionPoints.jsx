import React from 'react';
import { Card, Row, Col, Statistic, Progress, Divider, Space, Typography } from 'antd';
import { 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FileDoneOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DataEntryOverview = () => {
  // Mock data - replace with real API calls
  const stats = {
    totalEntries: 1245,
    verifiedEntries: 892,
    pendingVerification: 353,
    completionRate: 72,
    recentActivities: [
      { id: 1, action: 'Added new supplier', time: '2 hours ago' },
      { id: 2, action: 'Verified 15 janitor records', time: '4 hours ago' },
      { id: 3, action: 'Updated collection point data', time: '1 day ago' },
      { id: 4, action: 'Completed weekly report', time: '2 days ago' },
    ],
    quickActions: [
      { id: 1, name: 'Add New Supplier', icon: <DatabaseOutlined /> },
      { id: 2, name: 'Verify Data', icon: <CheckCircleOutlined /> },
      { id: 3, name: 'Generate Report', icon: <FileDoneOutlined /> },
    ]
  };

  return (
    <div className="data-entry-overview">
      <Title level={4} style={{ marginBottom: 24 }}>Data Entry Overview</Title>
      
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Entries"
              value={stats.totalEntries}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Verified Entries"
              value={stats.verifiedEntries}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={stats.pendingVerification}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ marginBottom: 8 }}>Completion Rate</Text>
              <Progress
                percent={stats.completionRate}
                strokeColor="#10b981"
                status="active"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Quick Actions */}
      <Title level={5} style={{ marginBottom: 16 }}>Quick Actions</Title>
      <Row gutter={[16, 16]}>
        {stats.quickActions.map(action => (
          <Col key={action.id} xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              bodyStyle={{ padding: '20px 10px' }}
            >
              <div style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }}>
                {action.icon}
              </div>
              <Text strong>{action.name}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      {/* Recent Activities */}
      <Title level={5} style={{ marginBottom: 16 }}>Recent Activities</Title>
      <Card>
        {stats.recentActivities.map(activity => (
          <div key={activity.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Space>
              <Text strong>{activity.action}</Text>
              <Text type="secondary">{activity.time}</Text>
            </Space>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default DataEntryOverview;