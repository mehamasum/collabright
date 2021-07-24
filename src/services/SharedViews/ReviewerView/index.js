import React, {useEffect, useState} from 'react';
import { Form, Input, Button, Layout, Card, Tabs, Space, Select } from 'antd';

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

const ReviewerView = () => {
  const [key, setKey] = useState(4);

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
          <Space>
            Audit Review
            <Select defaultValue="2" style={{ width: 120 }} onChange={handleChange}>
              <Option value="2">v2 (Latest)</Option>
              <Option value="1">v1</Option>
            </Select>
          </Space>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className={`reviewer-content ${key==2 ? 'reviewer-content-full' : ''}`}>
            <Tabs defaultActiveKey="4" onChange={callback} tabBarExtraContent={operations}>
              <TabPane tab="Details" key="4">
                Details
              </TabPane>
              <TabPane tab="Interactive Map" key="1">
                Map
              </TabPane>
              <TabPane tab="Comments" key="2">
                Comments
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
