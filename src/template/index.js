import React, { useEffect, useState } from 'react';
import './index.css';
import logo from '../assets/images/logo.svg';


import { Avatar, Dropdown, Layout, Menu, Spin, Typography, Badge } from "antd";
import {
  AppstoreOutlined,
  SettingOutlined,
  DownOutlined,
  UserOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useFetch from "use-http";
import { deleteFromStorage } from '@rehooks/local-storage';
import {Helmet} from "react-helmet";


const { Header, Sider, Content, Footer } = Layout;


const Template = (props) => {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(null);
  const { response, post, get } = useFetch();

  useEffect(() => {
    get('/api/auth/users/me/').then(data => {
      if (response.ok) {
        return setUser(data);
      }

      //deleteFromStorage('token');
    });
  }, []);

  useEffect(() => {
    get('/api/v1/notifications/').then(data => {
      if (response.ok) {
        const count = data.results.reduce((prev, curr) => !curr.read_at ? prev + 1 : prev, 0)
        console.log(count);
        //return setNotificationCount(count);
      }
    });
  }, []);

  const onLoggedOutClick = () => {
    post('/api/auth/token/logout/').then(() => {
      deleteFromStorage('token');
    });
  };

  const menu = (
    <Menu>
      <Menu.Item key="logout" onClick={e => {
        onLoggedOutClick();
      }}>
        Log Out
      </Menu.Item>
    </Menu>
  );

  if (!user) {
    return (
      <div className="full-page-loader"><Spin size="large" /></div>
    );
  }

  let pageName = props.path.substring(1).split('/')[0];
  pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  
  return (
    <Layout className="site-layout">
      <Header className="site-header">
        <Helmet>
          <title>{pageName || 'Dashboard'} | Collabright</title>
        </Helmet>
        <div className="app-logo">
          <img src={logo} className="App-logo" alt="logo" />
        </div>

        <div className="nav-right-menu">
          <div className="nav-right-menu-item">
            <Link to="/notifications">
              <Badge count={notificationCount >= 10 ? '10+' : notificationCount}>
                <NotificationOutlined />
              </Badge>
            </Link>
          </div>
          <div className="nav-right-menu-item">
            <Dropdown overlay={menu} trigger={['click']}>
              <div className="nav-right-profile-menu">
                <Avatar icon={<UserOutlined />} />
                <Typography className="nav-right-profile-username">{user.username}</Typography>
                <DownOutlined />
              </div>
            </Dropdown>
          </div>

        </div>
      </Header>
      <Layout>
        <Sider collapsible theme="light">
          <Menu mode="inline" defaultSelectedKeys={['1']} selectedKeys={[props.path]}>
            <Menu.Item key="/" icon={<AppstoreOutlined />}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="/audits" icon={<FolderOpenOutlined />}>
              <Link to="/audits">Audits</Link>
            </Menu.Item>
            <Menu.Item key="/contacts" icon={<TeamOutlined />}>
              <Link to="/contacts">Contacts</Link>
            </Menu.Item>
            <Menu.Item key="/settings" icon={<SettingOutlined />}>
              <Link to="/settings">Settings</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Content className="common-content-wrapper">
            <div className="common-content">
              {props.children}
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>

            <small style={{ fontSize: 10 }}>
              <Typography.Text type="secondary">
                © 2021, Collabright. All rights reserved.
                All product names, logos, and brands are property of their respective owners.
                Uses <a href="https://storyset.com/business">Business illustrations by Storyset</a>
              </Typography.Text>
            </small>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Template;
