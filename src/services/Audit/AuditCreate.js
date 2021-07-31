import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col, Divider } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import { useHistory } from "react-router-dom";
import useFetch from 'use-http';
import { loadModules } from 'esri-loader';
import MapPrinter from './MapPrinter';
import AddAuditors from './AddAuditors';


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

      if(data.auth) {
        setErrorMsg(data.auth);
      }
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
              <Step title="Create" />
              <Step title="Verify" />
              <Step title="Add Reviewers" />
            </Steps>
          </div>
          <Row>
            <Col span={16} offset={4}>
              <div className="audit-create-step">
                { current === 0 && <AuditForm onComplete={onComplete} />}
                { current === 1 && <MapPrinter auditId={audit.id} document={audit.documents[0]} onComplete={onVerify} version={1} renderNextButton/>}
                { current === 2 && <AddAuditors auditId={audit.id} onComplete={onFinish}/>}
              </div>
            </Col>
          </Row>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default PostCreateView;