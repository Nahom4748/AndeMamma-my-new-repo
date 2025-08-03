import React, { useState } from 'react';
import { Layout, Menu, Avatar, Badge, Card } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  InboxOutlined,
  UserOutlined,
  ShoppingOutlined,
  LoginOutlined,
  FormOutlined,
  MenuOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const NewDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('1');

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '2',
      icon: <ProjectOutlined />,
      label: 'Kanban',
      badge: 'Pro'
    },
    {
      key: '3',
      icon: <InboxOutlined />,
      label: 'Inbox',
      badge: 3
    },
    {
      key: '4',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '5',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '6',
      icon: <LoginOutlined />,
      label: 'Sign In',
    },
    {
      key: '7',
      icon: <FormOutlined />,
      label: 'Sign Up',
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Header */}
      <Header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none"
            >
              <MenuOutlined className="w-6 h-6" />
            </button>
            <a href="#" className="flex items-center ms-2 md:me-24">
              <img src="https://flowbite.com/docs/images/logo.svg" className="h-8 me-3" alt="Logo" />
              <span className="self-center text-xl font-semibold whitespace-nowrap">Flowbite</span>
            </a>
          </div>
          <div className="flex items-center">
            <Badge count={5} className="mr-4 cursor-pointer">
              <BellOutlined className="text-xl text-gray-600" />
            </Badge>
            <div className="flex items-center cursor-pointer">
              <Avatar 
                size="default" 
                src="https://flowbite.com/docs/images/people/profile-picture-5.jpg" 
                className="mr-2"
              />
              <span className="hidden md:inline">Neil Sims</span>
            </div>
          </div>
        </div>
      </Header>

      {/* Sidebar */}
      <Sider
        width={250}
        collapsed={collapsed}
        collapsedWidth={0}
        className="fixed top-16 left-0 h-screen z-40 transition-all"
        theme="light"
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onSelect={({ key }) => setSelectedMenu(key)}
          className="h-full pt-2 border-r-0"
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon} className="flex items-center">
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: collapsed ? 0 : 250, marginTop: 64 }}>
        <Content className="p-4">
          <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="flex items-center justify-center h-24 bg-gray-50">
                  <div className="text-2xl text-gray-400">
                    <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
            
            <Card className="flex items-center justify-center h-48 mb-4 bg-gray-50">
              <div className="text-2xl text-gray-400">
                <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                </svg>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="flex items-center justify-center h-28 bg-gray-50">
                  <div className="text-2xl text-gray-400">
                    <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
            
            <Card className="flex items-center justify-center h-48 mb-4 bg-gray-50">
              <div className="text-2xl text-gray-400">
                <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                </svg>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="flex items-center justify-center h-28 bg-gray-50">
                  <div className="text-2xl text-gray-400">
                    <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default NewDashboard;