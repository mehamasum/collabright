import React, { useEffect, useState, useRef } from 'react';
import { Typography, Spin, Button, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown, Descriptions } from 'antd';
import { CheckOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import Annotator from './Annotator';
import useFetch from 'use-http';
import { Row, Col, List, Badge, Divider } from 'antd';
import { truncateString } from '../../utils';

import './AuditDetails.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;

const adminOperations = (
  <Space>
    <Button>Add Sign Document</Button>
    <Button>Add Auditor</Button>
    <Button type="primary">Add Next Version</Button>
  </Space>
);

const operations = (
  <Space>
    <Dropdown overlay={(
      <Menu onClick={handleMenuClick}>
        <Menu.Item key="1" icon={<ReloadOutlined />}>
          Request Changes
        </Menu.Item>
        <Menu.Item key="2" icon={<CheckOutlined />}>
          Approve
        </Menu.Item>
      </Menu>
    )}>
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
      className="map-frame"
      title="Esri Map"
      width="100%"
      height="800"
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
const VersionPicker = ({ audit, version, handleVersionChange }) => {
  const versionIndex = parseInt(version, 10) - 1;
  return (
    <Space>
      <Text strong>Viewing</Text>
      <Select defaultValue={versionIndex} onChange={handleVersionChange} className="version-select" size="small">
        {
          audit.documents.map((_, index) => <Option value={index} key={`v${index + 1}`}>v{index + 1}.0 {index === audit.documents.length - 1 ? '(Latest)' : ''}</Option>).reverse()
        }
      </Select>
    </Space>
  )
}

const ReviewHeader = ({ audit, handleVersionChange, version, tab }) => {
  return (
    <PageHeader
      title={truncateString(audit.title, 50)}
      subTitle={audit.is_open ? <Tag color="success">Open</Tag> : <Tag color="purple">Closed</Tag>}
      extra={[
        <VersionPicker key="VersionPicker" audit={audit} handleVersionChange={handleVersionChange} version={version} />
      ]}
    />
  )
}



const AuditDetails = ({ auditId, isAdmin }) => {
  const [key, setKey] = useState('details'); // tab key
  const [audit, setAudit] = useState(null);
  const [version, setVersion] = useState(null);

  const versionIndex = parseInt(version, 10) - 1;
  const { get, response } = useFetch();

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

  function handleVersionChange(value) {
    const nextVersion = parseInt(value, 10) + 1;
    console.log(`selected ${value}`, nextVersion);
    setVersion(nextVersion);
  }

  if (!audit) return <div className="full-page-loader"><Spin size="large" /></div>;

  const document = audit.documents[versionIndex];
  console.log(document);

  const reviewers = [
    'Racing car',
    'Japanese princess',
    'Australian walks',
    'Man charged over',
    'Los Angeles',
  ];

  return (
    <div className="audit-content">
      <ReviewHeader audit={audit} version={version} handleVersionChange={handleVersionChange} tab={key} />

      <Tabs className="reviewer-tabs" defaultActiveKey={key} onChange={callback} tabBarExtraContent={isAdmin ? adminOperations : operations}>
        <TabPane tab="Details" key="details">
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            <Col className="gutter-row" span={18}>
              <Text strong>Audit Description</Text><br/>
              {audit.decription}
              <Divider/>

              <Text strong>Audit Map</Text><br/>
              {audit.map_url}
              <Divider/>

              <Text strong>Latest Version</Text><br/>
              v{audit.documents.length}.0
              <Divider/>

              <Text strong>Current Version</Text><br/>
              v{version}.0<br/>

              {document.description}
              <Divider/>

              <List
                header={<Text strong>Envelop Details</Text>}
                dataSource={[
                  'Audit Details',
                  'Map',
                  'Sign Document'
                ]}
                renderItem={(item, index) => (
                  <List.Item>
                    {item} {index == 1 && <>&bull; v{audit.documents.length}.0 (Latest Version)</>}
                  </List.Item>
                )}
              />
            </Col>
            <Col className="gutter-row" span={6}>
              <List
                header={<Text strong>Reviewers</Text>}
                dataSource={reviewers}
                renderItem={(item, index) => (
                  <List.Item actions={[<Badge key="list-loadmore-edit" status="processing" />]}>
                    {item}
                  </List.Item>
                )}
              />
              <Divider />
              <List
                header={<Text strong>Signers</Text>}
                dataSource={reviewers}
                renderItem={item => (
                  <List.Item actions={[<Badge key="list-loadmore-edit" status="success" />]}>
                    {item}
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Interactive Map" key="map">
          <EsriMap auditId={auditId} version={version} />
        </TabPane>
        <TabPane tab="Discussion" key="discussion">
          <Annotator key={versionIndex} document={document} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AuditDetails;
