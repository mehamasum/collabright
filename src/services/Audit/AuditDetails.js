import React, { useEffect, useState } from 'react';
import { Typography, Spin, Button, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown, Input, Tooltip, Popconfirm, Card } from 'antd';
import { DownOutlined, QuestionOutlined, FileFilled, FileUnknownOutlined, EditOutlined, LinkOutlined, CloseCircleFilled } from '@ant-design/icons';
import Annotator from './Annotator';
import useFetch from 'use-http';
import { Row, Col, List, Badge, Divider, Modal } from 'antd';
import { formatRelativeTime, truncateString } from '../../utils';
import MapPrinter from './MapPrinter';
import AddAuditors from './AddAuditors';
import './AuditDetails.css';
import { message } from 'antd';
import {EsriTemplate} from './EsriMap';
import { RedCross, GreenTick } from '../../components/icons';
import { useHistory, useParams, useLocation } from "react-router";
import EnvelopDetails, { SendEnvelop } from './EnvelopDetails';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;



const AdminOperations = ({ post, patch, response, audit, version }) => {
  const [document, setDocument] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(true);
  const auditId = audit.id;

  const handleOk = () => {
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
    setDescription(value);
  }

  const handleClose = () => {
    patch(`/api/v1/audits/${audit.id}/`, {
      is_open: false,
    }).then(data => {
      if (response.ok) {
        window.location.reload(false);
        return;
      }
      console.error(data);
    });
  };


  const menu = (
    <Menu>
      <Menu.Item key="close-audit" danger icon={<CloseCircleFilled />}>
        <Popconfirm title="Are you sure?" onConfirm={handleClose}>
          Mark as Closed
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Space>
        <SendEnvelop audit={audit} />
        {audit.is_open &&
          <Dropdown.Button
            type="primary"
            overlay={menu}
            onClick={onNewVersionClick}
            loading={loading}
            buttonsRender={([leftButton, rightButton]) => [
              React.cloneElement(leftButton, { loading }),
              rightButton
            ]}
          >
            Create Next Version
          </Dropdown.Button>}
      </Space>
      <Modal title="Building next version" visible={isModalVisible} onOk={handleOk} confirmLoading={confirmLoading} cancelButtonProps={{ style: { display: 'none' } }} closable={false}>
        <MapPrinter version={version} document={document} onComplete={onPrintComplete} />
        <TextArea placeholder="What's new in this version?" showCount maxLength={100} onChange={onChange} />
      </Modal>

    </>
  )
};

const ReviewerOperations = ({ audit, auditId, query, user, count }) => {
  const { post, response } = useFetch();

  const setVerdict = (verdict) => () => {
    post(`/api/v1/audits/${auditId}/verdict/?${query}`, {
      verdict
    }).then(data => {
      if (response.ok) {
        message.success(`Review Submitted - ${verdict === 'REQUESTED_CHANGES' ? 'Requested Change' : 'Approved'}`);
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
          <Menu.Item key="1" icon={RedCross()} onClick={setVerdict('REQUESTED_CHANGES')}>
            Request Changes
          </Menu.Item>
          <Menu.Item key="2" icon={GreenTick()} onClick={setVerdict('APPROVED')}>
            Approve
          </Menu.Item>
        </Menu>
      )}>
        <Button type="primary">
          Submit Review {count > 0 && <>&nbsp; <Badge count={count} /> &nbsp;</>} <DownOutlined />
        </Button>
      </Dropdown>
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

const ReviewHeader = ({ audit, handleVersionChange, version }) => {
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


const AuditDetails = ({ auditId, isAdmin = false, query }) => {
  const [count, setCount] = useState(0);
  const [audit, setAudit] = useState(null);
  const [user, setUser] = useState(null);
  const [version, setVersion] = useState(null);
  const [isReviewerModalVisible, setIsReviewerModalVisible] = useState(null);

  const onCountChange = (newCount) => {
    setCount(newCount);
  }


  const history = useHistory();
  const { tab } = useParams();
  const location = useLocation();
  const handleTabClick = key => {
    history.push(`/${isAdmin ? 'audits' : 'review'}/${auditId}/${key}${isAdmin ? '' : '?' + query}`);
  }

  const versionIndex = parseInt(version, 10) - 1;
  const { get, post, patch, response } = useFetch();

  useEffect(() => {
    get(isAdmin ? '/api/auth/users/me/' : `/api/v1/audits/${auditId}/me?${query}`).then(userData => {
      if (response.ok) {
        setUser(userData);
        get(`/api/v1/audits/${auditId}/${isAdmin ? '' : '?' + query}`).then(data => {
          if (response.ok) {
            setVersion(data.documents.length);
            setAudit(data);
          }
        });
      }
    });

  }, []);

  useEffect(() => {
    // docusign return catcher - ?envelopeId=123&event=Save
    if (!audit) return;
    const docusignUrlParams = new URLSearchParams(location.search);
    const hasEnvelopeIdParam = docusignUrlParams.get('envelopeId') === audit.envelope_id;
    const hasEnvelopeEventParam = docusignUrlParams.get('event') === 'Save';

    if (hasEnvelopeEventParam && hasEnvelopeIdParam)
      message.success('Envelope was saved');
  }, [location.search, audit])

  function handleVersionChange(value) {
    const nextVersion = parseInt(value, 10) + 1;
    setVersion(nextVersion);
  }


  const onEditReviewer = (e) => {
    setIsReviewerModalVisible('Reviewers');
  }

  const onEditSigner = (e) => {
    setIsReviewerModalVisible('Signers');
  }

  const onAuditorAddSuccess = () => {
    setIsReviewerModalVisible(false);
    message.success('Auditors updated!');
    setTimeout(() => window.location.reload(false), 1000);
  }

  if (!audit) return <div className="full-page-loader"><Spin size="large" /></div>;

  const document = audit.documents[versionIndex];
  const latestDocument = audit.documents[audit.documents.length - 1];

  const getBadgeType = (verdict) => {
    if (verdict === 'PENDING') return <QuestionOutlined />;
    if (verdict === 'APPROVED') return <GreenTick />;
    if (verdict === 'REQUESTED_CHANGES') return <RedCross />;
    return 'error';
  }
  const shouldDisabledEdit = audit.status === 'completed' || !audit.is_open;

  const needsToSign = !!audit.reviewers.find(reviewer => reviewer.id === user.id && !!reviewer.needs_to_sign);
  return (
    <div className="audit-content">
      <ReviewHeader audit={audit} version={version} handleVersionChange={handleVersionChange} />

      <Tabs className="reviewer-tabs" defaultActiveKey={tab || "details"} onChange={handleTabClick} tabBarExtraContent={
        isAdmin ? <AdminOperations post={post} patch={patch} response={response} audit={audit} version={audit.documents.length + 1} /> :
          <ReviewerOperations user={user} auditId={auditId} query={query} audit={audit} count={count} />
      }>
        <TabPane tab="Details" key="details">
          <Row gutter={8}>
            <Col className="gutter-row" span={16}>
              {audit.description || <Text italic>No description</Text>}
              <Divider />

              <Text strong>What's New</Text><br /><br />
              v{version}.0 &bull; Created: {formatRelativeTime(document.created_at)}<br />

              {document.description || <Text italic>No description</Text>}
              <Divider />

              <Text strong>Map</Text> &nbsp; <a href={audit.map_url} target="_blank" rel="noreferrer"><LinkOutlined /> Open</a><br /><br />
              On {new URL(audit.map_url).hostname}
              <Divider />

              <EnvelopDetails isAdmin={isAdmin} audit={audit} latestDocument={latestDocument} needsToSign={needsToSign} />
              <Divider />
            </Col>
            <Col className="gutter-row" span={8}>
              <List
                header={<div className="list-header"><Text strong>Signers</Text> <Button type="link" onClick={onEditSigner} disabled={shouldDisabledEdit}> <EditOutlined /> Edit</Button></div>}
                dataSource={audit.reviewers.filter(reviewer => reviewer.needs_to_sign)}
                renderItem={item => (
                  <List.Item actions={[
                    getBadgeType(item.verdict),
                    item.has_signed ? <FileFilled style={{ color: '#52c41a' }} /> : <FileUnknownOutlined />,
                  ]}>
                    <Tooltip title={item.contact.name}>
                      <Text>{item.contact.email} {item.id === user.id ? <Text type="secondary">(You)</Text> : ''}</Text>
                    </Tooltip>
                  </List.Item>
                )}
              />
              <Divider />
              <List
                header={<div className="list-header"><Text strong>Reviewers</Text> <Button type="link" onClick={onEditReviewer}> <EditOutlined /> Edit</Button></div>}
                dataSource={audit.reviewers.filter(reviewer => !reviewer.needs_to_sign)}
                renderItem={(item, index) => (
                  <List.Item actions={[getBadgeType(item.verdict),]}>
                    <Tooltip title={item.contact.name}>
                      <Text>{item.contact.email} {item.id === user.id ? <Text type="secondary">(You)</Text> : ''}</Text>
                    </Tooltip>
                  </List.Item>
                )}
              />
              <Divider />
              {/* TODO: implement this */}
              <Button onClick={() => message.error('This feature is not available yet')}>Unsubscribe</Button><br />
              <small><Text type="secondary">Stop receiving notifications for this version</Text></small>
              <Divider />
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Interactive Map" key="map">
          <EsriTemplate documentId={document.id} className="map-frame" isAdmin={isAdmin} query={query} homeButtonId="details-map-home-btn" />
        </TabPane>
        <TabPane tab={document.comment_count > 0 ? `Discussion (${document.comment_count})` : 'Discussion'} key="discussion">
          <Annotator key={versionIndex} document={document} isAdmin={isAdmin} query={query} user={isAdmin ? user.username : user.contact.email} count={count} onCountChange={onCountChange} />
        </TabPane>
      </Tabs>
      <Modal title={`Update ${isReviewerModalVisible}`} visible={!!isReviewerModalVisible} footer={null} onCancel={() => setIsReviewerModalVisible(false)}>
        <AddAuditors auditId={auditId} onComplete={onAuditorAddSuccess} existingReviewers={audit.reviewers} showSigners={isReviewerModalVisible === 'Signers'} />
      </Modal>
    </div>
  );
};

export default AuditDetails;
