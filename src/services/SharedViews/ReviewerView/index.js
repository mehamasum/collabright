import React, {useEffect, useState, useRef} from 'react';
import { Typography, Spin, Button, Layout, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown } from 'antd';
import { CheckOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import AuditDetails from '../../Audit/AuditDetails';
import logo from '../../../assets/images/logo.svg';
import {
  useParams,
  useLocation
} from "react-router-dom";

import './index.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;
const {Header, Sider, Content, Footer} = Layout;

const approveMenu = (
  <Menu onClick={handleMenuClick}>
    <Menu.Item key="1" icon={<ReloadOutlined />}>
      Request Changes
    </Menu.Item>
    <Menu.Item key="2" icon={<CheckOutlined />}>
      Approve
    </Menu.Item>
  </Menu>
);

const operations = (
  <Space>
    <Dropdown overlay={approveMenu}>
      <Button>
        Submit Review <DownOutlined />
      </Button>
    </Dropdown>
    <Button type="primary">Approve and Sign</Button>
  </Space>
);

function handleMenuClick(e) {
  console.log('click', e);
}
const VersionPicker = ({audit, version, handleVersionChange}) => {
  const versionIndex = parseInt(version, 10) - 1;
  return (
    <Space>
      <Text>Reviewing</Text>
      <Select defaultValue={versionIndex} onChange={handleVersionChange} className="version-select" size="small">
        {
          audit.documents.map((_, index) => <Option value={index} key={`v${index+1}`}>v{index+1}.0 {index===audit.documents.length-1? '(Latest)':''}</Option>).reverse()
        }
      </Select>
    </Space>
  )
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ReviewerView = () => {
  let { audit: auditId } = useParams();
  const query = useQuery();

  return (
    <React.Fragment>
      <Layout className="reviewer-layout">
        <Header className="site-header">
          <div className="app-logo">
            <img src={logo} className="App-logo" alt="logo"/>
          </div>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className="reviewer-content reviewer-content-full">
            <AuditDetails auditId={auditId} query={query}/>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
