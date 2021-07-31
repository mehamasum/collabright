import React, { useEffect, useState } from 'react';
import { Typography, Spin, Button, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown, Input, Tooltip } from 'antd';
import { CheckOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import Annotator from './Annotator';
import useFetch from 'use-http';
import { Row, Col, List, Badge, Divider, Modal } from 'antd';
import { truncateString } from '../../utils';
import MapPrinter from './MapPrinter';
import AddAuditors from './AddAuditors';
import './AuditDetails.css';
import { message } from 'antd';
import EsriMap from './EsriMap';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;



const AdminOperations = ({ post, patch, response, auditId, version }) => {
  const [ document, setDocument ] = useState(null);
  const [ description, setDescription ] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(true);
  const [isReviewerModalVisible, setIsReviewerModalVisible] = useState(false);


  const handleOk = () => {
    console.log('ok');
    setConfirmLoading(true);
    patch(`/api/v1/documents/${document.id}/`, {
      description,
    }).then(data => {
      setConfirmLoading(false);
      if (response.ok) {
        setIsModalVisible(false);
        window.location.reload(false);
        return;
      }
      console.error(data);
    });
     
  };

  const onPrintComplete = () => {
    setConfirmLoading(false);
  };

  const onNewVersionClick = (val) => {
    setLoading(true);
    post("/api/v1/documents/", {
      audit: auditId,
    }).then(data => {
      setLoading(false);
      if (response.ok) {
        setDocument(data);
        setLoading(false);
        return setIsModalVisible(true);
      }

      console.error(data);
    });
  };

  const onChange = (e) => {
    const value = e.target.value;
    console.log('Change:', value);
    setDescription(value);
  }

  const onAddReviewer = (e) => {
    setIsReviewerModalVisible(true);
  }

  const onAuditorAddSuccess = () => {
    setIsReviewerModalVisible(false);
    message.success('Auditor added!');
    setTimeout(() => window.location.reload(false), 1000);
  }

  return (
    <>
      <Space>
        <Button onClick={onAddReviewer}>Add Auditors</Button>
        <Button type="primary" onClick={onNewVersionClick} loading={loading}>Add Next Version</Button>
      </Space>
      <Modal title="Building next version" visible={isModalVisible} onOk={handleOk} confirmLoading={confirmLoading} cancelButtonProps={{ style: { display: 'none' } }} closable={false}>
        <MapPrinter auditId={auditId} version={version} document={document}onComplete={onPrintComplete} />
        <TextArea placeholder="What's new in this version?" showCount maxLength={100} onChange={onChange} />
      </Modal>
      <Modal title="Add Auditors" visible={isReviewerModalVisible} footer={null} onCancel={() => setIsReviewerModalVisible(false)}>
        <AddAuditors auditId={auditId} onComplete={onAuditorAddSuccess}/>
      </Modal>
    </>
  )
};

const ReviewerOperations = ({auditId, query}) => {
  const { post, response } = useFetch();

  const setVerdict = (verdict) => () => {
    post(`/api/v1/audits/${auditId}/${verdict}/?${query}`).then(data => {
      if (response.ok) {
        message.success(`Review Submitted - ${verdict==='disapprove' ? 'Requested Change' : 'Approved'}`);
        setTimeout(() => window.location.reload(false), 1000);
        return;
      }
      console.error(data);
    });
  }

  return (
    <Space>
      <Dropdown overlay={(
        <Menu>
          <Menu.Item key="1" icon={<ReloadOutlined />} onClick={setVerdict('disapprove')}>
            Request Changes
          </Menu.Item>
          <Menu.Item key="2" icon={<CheckOutlined />} onClick={setVerdict('approve')}>
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
  )
};


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



const AuditDetails = ({ auditId, isAdmin, query }) => {
  const [key, setKey] = useState('details'); // tab key
  const [audit, setAudit] = useState(null);
  const [user, setUser] = useState(null);
  const [version, setVersion] = useState(null);

  const versionIndex = parseInt(version, 10) - 1;
  const { get, post, patch, response } = useFetch();

  useEffect(() => {
    get(isAdmin ? '/api/auth/users/me/' : `/api/v1/audits/${auditId}/me?${query}`).then(userData => {
      if (response.ok) {
        setUser(userData);
        get(`/api/v1/audits/${auditId}/${isAdmin ? '' : '?'+query}`).then(data => {
          if (response.ok) {
            setVersion(data.documents.length);
            setAudit(data);
          }
        });
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

  const getBadgeType = (verdict) => {
    if(verdict==='PENDING') return 'processing';
    if(verdict==='APPROVED') return 'success';
    if(verdict==='REQUESTED_CHANGES') return 'error';
    return 'error';
  }

  return (
    <div className="audit-content">
      <ReviewHeader audit={audit} version={version} handleVersionChange={handleVersionChange} tab={key} />

      <Tabs className="reviewer-tabs" defaultActiveKey={key} onChange={callback} tabBarExtraContent={
        isAdmin ? <AdminOperations post={post} patch={patch} response={response} auditId={auditId} version={audit.documents.length + 1}/> :
        <ReviewerOperations auditId={auditId} query={query}/>
      }>
        <TabPane tab="Details" key="details">
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            <Col className="gutter-row" span={18}>
              <Text strong>Audit Description</Text><br />
              {audit.decription}
              <Divider />

              <Text strong>Audit Map</Text><br />
              {audit.map_url}
              <Divider />

              <Text strong>Latest Version</Text><br />
              v{audit.documents.length}.0
              <Divider />

              <Text strong>Current Version</Text><br />
              v{version}.0<br />

              {document.description}
              <Divider />

              <List
                header={<Text strong>Envelop Details</Text>}
                dataSource={[
                  'Audit Details',
                  'Map',
                  <Space>Agreement {isAdmin && <Button type="link" size="small">Attach</Button>}</Space>
                ]}
                renderItem={(item, index) => (
                  <List.Item>
                    {item} {index == 1 && <>&bull; v{audit.documents.length}.0 (Latest Version)</>}
                  </List.Item>
                )}
              />
              <Divider />
            </Col>
            <Col className="gutter-row" span={6}>
              <List
                header={<Text strong>Reviewers</Text>}
                dataSource={audit.reviewers}
                renderItem={(item, index) => (
                  <List.Item actions={[<Badge key="list-loadmore-edit" status={getBadgeType(item.verdict)} />]}>
                    <Tooltip title={item.contact.name}>
                      <span>{item.contact.email}</span>
                    </Tooltip>
                  </List.Item>
                )}
              />
              <Divider />
              <List
                header={<Text strong>Signers</Text>}
                dataSource={audit.reviewers.filter(reviewer => reviewer.needs_to_sign)}
                renderItem={item => (
                  <List.Item actions={[<Badge key="list-loadmore-edit" status={item.has_signed ? "success" : "processing" } />]}>
                    <Tooltip title={item.contact.name}>
                      <span>{item.contact.email}</span>
                    </Tooltip>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Interactive Map" key="map">
          <EsriMap documentId={document.id} className="map-frame" isAdmin={isAdmin} query={query}/>
        </TabPane>
        <TabPane tab="Discussion" key="discussion">
          <Annotator key={versionIndex} document={document} isAdmin={isAdmin} query={query} user={isAdmin ? user.username : user.contact.email}/>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AuditDetails;
