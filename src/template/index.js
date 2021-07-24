import React, { useEffect, useState } from 'react';
import './index.css';
import logo from '../assets/images/logo.svg';


import {Avatar, Dropdown, Layout, Menu, Spin, Typography} from "antd";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DownOutlined,
  UserOutlined
} from '@ant-design/icons';
import {Link} from 'react-router-dom';
import useFetch from "use-http";
import { deleteFromStorage } from '@rehooks/local-storage';



const {Header, Sider, Content, Footer} = Layout;


const Template = (props) => {
  const [user, setUser] = useState(null);
  const {response, post, get} = useFetch();

  useEffect(() => {
    get('/api/auth/users/me/').then(data => {
      if (response.ok) {
        return setUser(data);
      }

      deleteFromStorage('token');
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
      <div className="full-page-loader"><Spin size="large"/></div>
    );
  }

  return (
    <Layout className="site-layout">
      <Header className="site-header">
        <div className="app-logo">
          <img src={logo} className="App-logo" alt="logo"/>
        </div>

        <div className="nav-right-menu">
          <div className="nav-right-menu-item">
            <Dropdown overlay={menu} trigger={['click']}>
              <div className="nav-right-profile-menu">
                <Avatar icon={<UserOutlined/>}/>
                <Typography className="nav-right-profile-username">{user.username}</Typography>
                <DownOutlined/>
              </div>
            </Dropdown>
          </div>

        </div>
      </Header>
      <Layout>
        <Sider collapsible theme="light">
          <Menu mode="inline" defaultSelectedKeys={['1']} selectedKeys={[props.path]}>
            <Menu.Item key="/" icon={<AppstoreOutlined/>}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="/audits" icon={<ClockCircleOutlined/>}>
              <Link to="/audits">Audits</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Content className="common-content-wrapper">
            <div className="common-content">
              {props.children}
            </div>
          </Content>
          <Footer style={{textAlign: 'center'}}> Collabright © 2021</Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Template;
