import React, {useEffect, useState, useRef} from 'react';
import { Form, Spin, Button, Layout, Card, Tabs, Space, Select, PageHeader } from 'antd';
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


const {Header, Sider, Content, Footer} = Layout;

const operations = (
  <Space>
    <Button>Review</Button>
    <Button type="primary">Sign</Button>
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

const ReviewerView = () => {
  const [key, setKey] = useState(1); // tab key
  const [audit, setAudit] = useState(null);
  let { audit: auditId, version } = useParams();
  const history = useHistory();
  const versionIndex = parseInt(version, 10) - 1;
  const {get, response} = useFetch();

  useEffect(() => {
    get(`/api/v1/audits/${auditId}`).then(data => {
      if (response.ok) {
        setAudit(data);
      }
    });
  }, []);

  function callback(key) {
    setKey(key);
  }

  function handleChange(value) {
    console.log(`selected ${value}`);
    const nextVersion = parseInt(value, 10) + 1;
    console.log(`selected ${value}`, nextVersion);
    history.push(`/review/${auditId}/${nextVersion}`)
  }

  if (!audit) return <div className="full-page-loader"><Spin size="large"/></div>;

  const document = audit.documents[versionIndex];

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
              <Select defaultValue={versionIndex} onChange={handleChange} className="version-select">
                {
                  audit.documents.map((_, index) => <Option value={index} key={`v${index+1}`}>v{index+1}.0 {index===audit.documents.length-1? '(Latest)':''}</Option>).reverse()
                }
              </Select>
            </Space>
            <Tabs className="reviewer-tabs" defaultActiveKey={key} onChange={callback} tabBarExtraContent={operations}>
              <TabPane tab="Details" key="1">
                <code>{JSON.stringify(audit)}</code>
              </TabPane>
              <TabPane tab="Interactive Map" key="2">
                <EsriMap auditId={auditId} version={version} />
              </TabPane>
              <TabPane tab="Comments" key="3">
                <Annotator document={document}/>
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
