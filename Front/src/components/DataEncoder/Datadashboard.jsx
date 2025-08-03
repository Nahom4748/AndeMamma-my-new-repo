import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Badge, Avatar, FloatButton, Table, Card, Statistic } from 'antd';
import {
  DashboardOutlined, DatabaseOutlined, ShopOutlined, TeamOutlined,
  BarChartOutlined, LogoutOutlined, MenuOutlined, BellOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import axios from 'axios';
import SuppliersManagement from './SuppliersManagement';
import Reports from './Reports';
import JanitorsManagement from './JanitorsManagement';
import DailyCollection from './DailyCollection';
import WeeklyPlan from './WeeklyPlan';
import WeeklyPlanDisplay from './WeeklyPlanDisplay';
import MarketerVisitPlan from './MarketerVisitPlan';
import DailyCollectionReport from './DailyCollectionReport';
import PaperCollectionPieChart from './PaperCollectionPieChart';
import SupplierMarketerAssignment from './SupplierMarketerAssignment';
import UsersManagment from './UsersManagment';
import { Users } from 'lucide-react';
import VisitPlansTable from './VisitPlansTable';

const { Header } = Layout;
const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
const dummyData = [
  { paper_type: "Carton", total_kg: "1062.00" },
  { paper_type: "Metal", total_kg: "52.00" },
  { paper_type: "Mixed", total_kg: "2555595.00" },
  { paper_type: "NP", total_kg: "52.00" },
  { paper_type: "SC", total_kg: "30.00" },
  { paper_type: "SW", total_kg: "100.00" },

];
const DataEncoderDashboard = () => {
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState('1');
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [summary, setSummary] = useState(null);
  const [collectionTypes, setCollectionTypes] = useState([]);
  const [collectionList, setCollectionList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [res1, res2, res3] = await Promise.all([
          axios.get('http://localhost:5000/api/collection/summary'),
          axios.get('http://localhost:5000/api/collection/types'),
          axios.get('http://localhost:5000/api/collection/list')
        ]);
        setSummary(res1.data.data || null);
        setCollectionTypes(res2.data.data || []);
        setCollectionList(res3.data.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { key: '1', icon: DashboardOutlined, label: 'Dashboard' },
    { key: '2', icon: DatabaseOutlined, label: 'Collection Points' },
    { key: '3', icon: ShopOutlined, label: 'Suppliers' },
    { key: '4', icon: TeamOutlined, label: 'Janitors' },
    { key: '5', icon: BarChartOutlined, label: 'Reports' },
    { key: '6', icon: LogoutOutlined, label: 'WeeklyPlan' },
    { key: '7', icon: LogoutOutlined, label: 'WeeklyPlanDisplay' },

    // Add more menu items as needed
    { key: '8', icon: UserOutlined, label: 'MarketerVisitPlan' },
    {key:'9',icon:UserOutlined,label:'DailyCollectionReport'} ,
    { key: '10', icon: BellOutlined, label: 'Assiginmarketor' },
    { key: '11', icon: LogoutOutlined, label: 'Employee' },
    { key: '12', icon: Users, label: 'Vesit report' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bordered={false} className="shadow-md hover:shadow-lg transition-shadow">
          <Statistic title="Total Collection" value={summary?.totalKg || 0} precision={2} valueStyle={{ color: '#065f46' }} suffix="kg" loading={loading} />
        </Card>
        <Card bordered={false} className="shadow-md hover:shadow-lg transition-shadow">
          <Statistic title="In-store Collection" value={summary?.instoreKg || 0} precision={2} valueStyle={{ color: '#059669' }} suffix="kg" loading={loading} />
        </Card>
        <Card bordered={false} className="shadow-md hover:shadow-lg transition-shadow">
          <Statistic title="Regular Collection" value={summary?.regularKg || 0} precision={2} valueStyle={{ color: '#10b981' }} suffix="kg" loading={loading} />
        </Card>
        <Card bordered={false} className="shadow-md hover:shadow-lg transition-shadow">
          <Statistic title="Active Suppliers" value={summary?.totalSuppliers || 0} valueStyle={{ color: '#047857' }} loading={loading} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Collection Types Distribution" bordered={false} className="shadow-md hover:shadow-lg transition-shadow" loading={loading}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionTypes}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {collectionTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kg`, 'Amount']} />
                <Legend layout={isMobile ? 'horizontal' : 'vertical'} verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Collections" bordered={false} className="shadow-md hover:shadow-lg transition-shadow" loading={loading}>
          <Table
            size="small"
            rowKey="name"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: 'Name', dataIndex: 'name', render: (text) => <span className="font-medium">{text}</span> },
              { title: 'Type', dataIndex: 'type', render: (text) => <span className="text-gray-600">{text}</span> },
              {
                title: 'Amount (kg)',
                dataIndex: 'totalKg',
                sorter: (a, b) => (a.totalKg || 0) - (b.totalKg || 0),
                render: (val) => {
                  const num = parseFloat(val);
                  return <span className="font-bold text-green-600">{!isNaN(num) ? num.toFixed(2) : '0.00'}</span>;
                },
                align: 'right'
              }
            ]}
            dataSource={collectionList}
          />
        </Card>
      </div>
 <PaperCollectionPieChart />
      <Card title="Weekly Collection Trend" bordered={false} className="shadow-md hover:shadow-lg transition-shadow" loading={loading}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={collectionTypes}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} kg`, 'Amount']} labelStyle={{ fontWeight: 'bold', color: '#065f46' }} />
              <Legend />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  const components = {
    '1': renderDashboard(),
    '2': <DailyCollection />,
    '3': <SuppliersManagement />,
    '4': <JanitorsManagement />,
    '5': <Reports />,
    '6': <WeeklyPlan />,
    '7':<WeeklyPlanDisplay/>,
    "8":<MarketerVisitPlan/>,
    '9': <DailyCollectionReport/>,
    '10': <SupplierMarketerAssignment />,
    '11': <UsersManagment/>,
    '12': <VisitPlansTable />
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {!isMobile && (
        <Layout.Sider
          width={250}
          theme="light"
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 1000,
            overflowY: 'auto',
            background: 'linear-gradient(to bottom, #065f46, #047857)'
          }}
        >
          <div className="p-6 text-2xl font-bold text-white flex items-center">
            <img src="/logo.png" alt="AndeMamma Logo" className="h-8 w-8 mr-2" />
            AndeMamma
          </div>
          <div className="flex flex-col h-full justify-between">
            <div className="mt-4">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedMenu(item.key)}
                    className={`flex items-center px-6 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMenu === item.key
                        ? 'bg-white text-green-700 shadow-md'
                        : 'text-white hover:bg-white hover:bg-opacity-20'
                    }`}
                  >
                    <Icon className="mr-3 text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <div
              onClick={handleLogout}
              className="flex items-center px-6 py-3 mx-2 mb-4 rounded-lg cursor-pointer text-white hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <LogoutOutlined className="mr-3 text-lg" />
              <span className="font-medium">Logout</span>
            </div>
          </div>
        </Layout.Sider>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : 250 }}>
        <Header className="bg-white shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center">
            {isMobile && (
              <MenuOutlined onClick={() => setDrawerVisible(true)} className="text-xl text-green-600 mr-4" />
            )}
            <h1 className="text-xl font-semibold text-gray-800">
              {menuItems.find(i => i.key === selectedMenu).label}
            </h1>
          </div>
          <div className="flex items-center space-x-5">
            <Badge count={5} dot>
              <BellOutlined className="text-xl text-gray-600 cursor-pointer hover:text-green-600" />
            </Badge>
            <div className="flex items-center space-x-2 cursor-pointer">
              <Avatar size="default" icon={<UserOutlined />} className="bg-green-500" />
              <span className="hidden md:inline font-medium">Data Encoder</span>
            </div>
          </div>
        </Header>

        <Layout.Content className="p-4 md:p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            {components[selectedMenu]}
          </div>
        </Layout.Content>
      </Layout>

      <Drawer
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={250}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <div className="h-full" style={{ background: 'linear-gradient(to bottom, #065f46, #047857)' }}>
          <div className="p-6 text-2xl font-bold text-white flex items-center">
            <img src="/logo.png" alt="AndeMamma Logo" className="h-8 w-8 mr-2" />
            AndeMamma
          </div>
          <div className="mt-4">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  onClick={() => {
                    setSelectedMenu(item.key);
                    setDrawerVisible(false);
                  }}
                  className={`flex items-center px-6 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                    selectedMenu === item.key
                      ? 'bg-white text-green-700 shadow-md'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <Icon className="mr-3 text-lg" />
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center px-6 py-3 mx-2 mt-4 rounded-lg cursor-pointer text-white hover:bg-white hover:bg-opacity-20 transition-colors absolute bottom-4 left-0 right-0"
          >
            <LogoutOutlined className="mr-3 text-lg" />
            <span className="font-medium">Logout</span>
          </div>
        </div>
      </Drawer>

      {isMobile && <FloatButton.BackTop className="right-6 bottom-6" visibilityHeight={300} />}
    </Layout>
  );
};

export default DataEncoderDashboard;
