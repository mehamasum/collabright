import React, { useCallback, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import { useHistory } from "react-router-dom";
import useFetch from 'use-http';

import './AuditCreate.css';

const { Step } = Steps;
const { Text } = Typography;

const AuditForm = ({ onComplete }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const { post, response, loading } = useFetch();

  const onFinish = values => {
    post('/api/v1/audits/', values).then(data => {
      if (response.ok) {
        return onComplete(data);
      }
      console.error(data);
      setErrorMsg(data.message);
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      <Text strong>Please fill up the form</Text>
      {errorMsg && <Alert message={errorMsg} type="error" banner closable/> }
      <Form
        name="audit"
        initialValues={{}}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[
            {
              required: true,
              message: 'Please input title!',
            },
          ]}
        >
          <Input placeholder="Title for this audit"/>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            {
              required: true,
              message: 'Please input description!',
            },
          ]}
        >
          <Input.TextArea placeholder="A description to ive reviewers context" rows={6}/>
        </Form.Item>

        <Form.Item
          label="Map URL"
          name="map_url"
          rules={[
            {
              required: true,
              message: 'Please input your map_url!',
            },
          ]}
        >
          <Input placeholder="Copy the map URL from your GIS site and paste here" type="url"/>
        </Form.Item>
        <Form.Item >
          <Button type="primary" htmlType="submit" loading={loading}>
            Continue
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

const VerifyForm = ({ auditId, onComplete }) => {
  return (
    <>
      <Text strong>Please verify your map</Text>
      <iframe
        className="map-verify"
        title="Esri Map"
        width="100%"
        height="400"
        frameBorder="0"
        border="0"
        cellSpacing="0"
        src={`/map-preview.html?audit_id=${auditId}&version=1`}>
      </iframe>
      <Button type="primary" onClick={onComplete}>
        Continue
      </Button>
    </>
  )
}


const ReviewerForm = ({ onComplete }) => {
  return (
    <>
      <Text strong>Please add Reviewers and Signers</Text>
      <div>
        Reviewer
        Signer
        Upload signable
      </div>
      <Button type="primary" onClick={onComplete}>
        Continue
      </Button>
    </>
  )
}

const PostCreateView = () => {
  const history = useHistory();
  const [current, setCurrent] = React.useState(0);
  const [audit, setAudit] = React.useState(0);

  const onComplete = (data) => {
    console.log(data);
    setAudit(data);
    setCurrent(current + 1);
  };

  const onVerify = () => {
    setCurrent(current + 1);
  };

  const onFinish = () => {
    setCurrent(current + 1);
    history.push(`/audits/${audit.id}`);
  }

  return (
    <React.Fragment>
      <Layout.Content>
        <Card title="New Audit">
          <div className="audit-create-steps">
            <Steps current={current} size="small">
              <Step title="Create" description={<small>Add Audit info</small>} />
              <Step title="Verify" description={<small>Verify retrived map</small>} />
              <Step title="Add Reviewers" description={<small>Upload document and assign Reviewers</small>} />
            </Steps>
          </div>
          <Row>
            <Col span={16} offset={4}>
              <div className="audit-create-step">
                { current === 0 && <AuditForm onComplete={onComplete} />}
                { current === 1 && <VerifyForm auditId={audit.id} onComplete={onVerify}/>}
                { current === 2 && <ReviewerForm onComplete={onFinish}/>}
              </div>
            </Col>
          </Row>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default PostCreateView;