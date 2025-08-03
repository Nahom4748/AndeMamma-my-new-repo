import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, FloatButton, Drawer, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const { Header, Sider, Content } = Layout;
const { useToken } = theme;

// Sample data for charts
const salesData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const productData = [
  { name: 'Doors', value: 400 },
  { name: 'Panels', value: 300 },
  { name: 'Flooring', value: 200 },
  { name: 'Partitions', value: 278 },
];

const userActivity = [
  { name: 'Mon', active: 4000, new: 2400 },
  { name: 'Tue', active: 3000, new: 1398 },
  { name: 'Wed', active: 2000, new: 9800 },
  { name: 'Thu', active: 2780, new: 3908 },
  { name: 'Fri', active: 1890, new: 4800 },
  { name: 'Sat', active: 2390, new: 3800 },
  { name: 'Sun', active: 3490, new: 4300 },
];

const COLORS = ['#22c55e', '#86efac', '#4ade80', '#16a34a'];

// Dashboard Components
const DashboardOverview = () => {
  const { token } = useToken();
  
  return (
    <div className="dashboard-grid">
      <div className="stat-cards">
        <StatCard 
          title="Total Sales" 
          value="$24,780" 
          change="+12.5%" 
          icon={<ShoppingCartOutlined />}
          color={token.colorPrimary}
        />
        <StatCard 
          title="Active Users" 
          value="1,429" 
          change="+8.2%" 
          icon={<UserOutlined />}
          color="#3b82f6"
        />
        <StatCard 
          title="New Orders" 
          value="324" 
          change="+5.7%" 
          icon={<FileTextOutlined />}
          color="#8b5cf6"
        />
        <StatCard 
          title="Conversion" 
          value="3.6%" 
          change="-0.8%" 
          icon={<LineChartOutlined />}
          color="#ec4899"
        />
      </div>

      <div className="chart-card">
        <h3>Sales Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={token.colorPrimary} 
              fill={token.colorPrimaryBg} 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>User Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userActivity}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="active" fill={token.colorPrimary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="new" fill="#86efac" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Product Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={productData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label
            >
              {productData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon, color }) => {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h4>{title}</h4>
        <p className="stat-value">{value}</p>
        <p className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {change} {isPositive ? '↑' : '↓'}
        </p>
      </div>
    </div>
  );
};

const Users = () => <div className="content-placeholder">Users Management</div>;
const Products = () => <div className="content-placeholder">Products Management</div>;
const Reports = () => <div className="content-placeholder">Reports Analytics</div>;

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('1');
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { token } = useToken();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const components = {
    '1': <DashboardOverview />,
    '2': <Users />,
    '3': <Products />,
    '4': <Reports />,
  };

  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '2', icon: <UserOutlined />, label: 'Users' },
    { key: '3', icon: <ShoppingCartOutlined />, label: 'Products' },
    { key: '4', icon: <PieChartOutlined />, label: 'Reports' },
    { key: '5', icon: <FileTextOutlined />, label: 'Documents' },
    { key: '6', icon: <SettingOutlined />, label: 'Settings' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          style={{
            background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
        >
          <div className="logo" style={{
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? '18px' : '22px',
            fontWeight: 'bold'
          }}>
            {collapsed ? 'AM' : 'AndeMamma'}
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedMenu]}
            onSelect={({ key }) => setSelectedMenu(key)}
            style={{ background: 'transparent', border: 'none' }}
          >
            {menuItems.map(item => (
              <Menu.Item
                key={item.key}
                icon={React.cloneElement(item.icon, { style: { fontSize: '18px' } })}
                style={{
                  margin: '8px 16px',
                  borderRadius: '12px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>
      )}

      {/* Drawer for Mobile */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={260}
          bodyStyle={{ background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)', padding: 0 }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            color: 'white'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>AndeMamma</div>
            <CloseOutlined onClick={() => setDrawerVisible(false)} style={{ fontSize: '18px', cursor: 'pointer' }} />
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedMenu]}
            onSelect={({ key }) => {
              setSelectedMenu(key);
              setDrawerVisible(false);
            }}
            style={{ background: 'transparent', border: 'none' }}
          >
            {menuItems.map(item => (
              <Menu.Item
                key={item.key}
                icon={React.cloneElement(item.icon, { style: { fontSize: '18px' } })}
                style={{
                  margin: '8px 16px',
                  borderRadius: '12px',
                  height: '48px'
                }}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Drawer>
      )}

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 16px',
          background: token.colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 8px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {isMobile && (
            <MenuOutlined 
              onClick={() => setDrawerVisible(true)} 
              style={{ fontSize: '20px', cursor: 'pointer', color: token.colorText }} 
            />
          )}
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: token.colorText,
            marginLeft: isMobile ? '16px' : 0
          }}>
            {components[selectedMenu].type.name || 'Dashboard'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={4} style={{ cursor: 'pointer' }}>
              <BellOutlined style={{ fontSize: '18px', color: token.colorText }} />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: token.colorPrimary }} icon={<UserOutlined />} />
              {!isMobile && <span style={{ fontWeight: '500', color: token.colorText }}>Admin</span>}
            </div>
          </div>
        </Header>

        {/* Content */}
        <Content style={{
          margin: isMobile ? '16px' : '24px',
          padding: isMobile ? '16px' : '24px',
          minHeight: 'calc(100vh - 112px)',
          background: token.colorBgContainer,
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          {components[selectedMenu]}
          {isMobile && (
            <FloatButton.BackTop
              visibilityHeight={100}
              style={{ right: 24, bottom: 24, backgroundColor: token.colorPrimary, color: 'white' }}
            />
          )}
        </Content>
      </Layout>

      {/* Global Styles */}
      <style jsx global>{`
        .dashboard-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        
        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          grid-column: 1 / -1;
        }
        
        .stat-card {
          background: ${token.colorBgContainer};
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 16px;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-content h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: ${token.colorTextSecondary};
        }
        
        .stat-value {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          color: ${token.colorText};
        }
        
        .stat-change {
          margin: 4px 0 0 0;
          font-size: 13px;
          font-weight: 500;
        }
        
        .stat-change.positive {
          color: ${token.colorSuccess};
        }
        
        .stat-change.negative {
          color: ${token.colorError};
        }
        
        .chart-card {
          background: ${token.colorBgContainer};
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          grid-column: span 1;
        }
        
        .chart-card h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 500;
          color: ${token.colorText};
        }
        
        .content-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          font-size: 24px;
          color: ${token.colorTextSecondary};
        }
        
        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(12, 1fr);
          }
          
          .stat-cards {
            grid-column: span 12;
          }
          
          .chart-card:nth-child(2) {
            grid-column: span 8;
          }
          
          .chart-card:nth-child(3) {
            grid-column: span 4;
          }
          
          .chart-card:nth-child(4) {
            grid-column: span 6;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminDashboard;