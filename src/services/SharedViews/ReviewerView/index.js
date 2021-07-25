import React, {useEffect, useState, useRef} from 'react';
import { Form, Input, Button, Layout, Card, Tabs, Space, Select, PageHeader } from 'antd';
import { loadModules } from "esri-loader";
import Annotator from './Annotator';
import logo from '../../../assets/images/logo.svg';

import './index.css';

const { TabPane } = Tabs;
const { Option } = Select;


const {Header, Sider, Content, Footer} = Layout;

const operations = (
  <Space>
    <Button>Review</Button>
    <Button type="primary">Sign</Button>
  </Space>
);

function EsriMap({ id }) {
  return (
    <iframe
        title="Esri Map"
        width="100%"
        height="600"
        frameBorder="0"
        border="0"
        cellSpacing="0"
        src="/mapviewer/index.html">
    </iframe>
  );
}

const ReviewerView = () => {
  const [key, setKey] = useState(1); // tab key

  function callback(key) {
    setKey(key);
  }

  function handleChange(value) {
    console.log(`selected ${value}`);
  }

  return (
    <React.Fragment>
      <Layout className="reviewer-layout">
        <Header className="site-header">
          <div className="app-logo">
            <img src={logo} className="App-logo" alt="logo"/>
          </div>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className={`reviewer-content ${key==3 ? 'reviewer-content-full' : ''}`}>
            <Space>
              <PageHeader
                title="Audit"
              />
              <Select defaultValue="2" style={{ width: 120 }} onChange={handleChange}>
                <Option value="2">v2 (Latest)</Option>
                <Option value="1">v1</Option>
              </Select>
            </Space>
            <Tabs className="reviewer-tabs" defaultActiveKey={key} onChange={callback} tabBarExtraContent={operations}>
              <TabPane tab="Details" key="1">
                Details
              </TabPane>
              <TabPane tab="Interactive Map" key="2">
                <EsriMap id="7a18444ddea349c08ed28db0929d0395" />
              </TabPane>
              <TabPane tab="Comments" key="3">
                <Annotator />
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
