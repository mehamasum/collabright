import React, {useEffect, useState, useRef} from 'react';
import { Typography, Spin, Button, Layout, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown } from 'antd';
import { CheckOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import Annotator from './Annotator';
import logo from '../../../assets/images/logo.svg';
import {
  useParams,
  useHistory
} from "react-router-dom";
import useFetch from 'use-http';

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

function EsriMap({ auditId, version }) {
  return (
    <iframe
        title="Esri Map"
        width="100%"
        height="600"
        frameBorder="0"
        border="0"
        cellSpacing="0"
        src={`/mapviewer/index.html?audit_id=${auditId}&version=${version}`}>
    </iframe>
  );
}

function handleMenuClick(e) {
  console.log('click', e);
}



const ReviewerView = () => {
  const [key, setKey] = useState('details'); // tab key
  const [audit, setAudit] = useState(null);
  const [version, setVersion] = useState(null);
  let { audit: auditId } = useParams();

  const versionIndex = parseInt(version, 10) - 1;
  const {get, response} = useFetch();

  useEffect(() => {
    get(`/api/v1/audits/${auditId}`).then(data => {
      if (response.ok) {
        setVersion(data.documents.length);
        setAudit(data);
      }
    });
  }, []);

  function callback(key) {
    setKey(key);
  }

  function handleChange(value) {
    const nextVersion = parseInt(value, 10) + 1;
    console.log(`selected ${value}`, nextVersion);
    setVersion(nextVersion);
  }

  if (!audit) return <div className="full-page-loader"><Spin size="large"/></div>;

  const document = audit.documents[versionIndex];

  const VersionPicker = () => (
    <Space>
      <Text>Reviewing</Text>
      <Select defaultValue={versionIndex} onChange={handleChange} className="version-select" size="small">
        {
          audit.documents.map((_, index) => <Option value={index} key={`v${index+1}`}>v{index+1}.0 {index===audit.documents.length-1? '(Latest)':''}</Option>).reverse()
        }
      </Select>
    </Space>
  )

  return (
    <React.Fragment>
      <Layout className="reviewer-layout">
        <Header className="site-header">
          <div className="app-logo">
            <img src={logo} className="App-logo" alt="logo"/>
          </div>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className={`reviewer-content ${key==="discussion" ? 'reviewer-content-full' : ''}`}>
            <PageHeader
              title={audit.title}
              subTitle={audit.is_open ? <Tag color="success">Open</Tag> : <Tag color="error">Closed</Tag> }
              extra={[
                <VersionPicker key="1"/>
              ]}
            />
            
              
            <Tabs className="reviewer-tabs" defaultActiveKey={key} onChange={callback} tabBarExtraContent={operations}>
              <TabPane tab="Details" key="details">
                <code>{JSON.stringify(audit)}</code>
              </TabPane>
              <TabPane tab="Interactive Map" key="map">
                <EsriMap auditId={auditId} version={version} />
              </TabPane>
              <TabPane tab="Discussion" key="discussion">
                <Annotator key={versionIndex} document={document}/>
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
