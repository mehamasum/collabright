import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col, Divider, Upload } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import { useHistory } from "react-router-dom";
import useFetch from 'use-http';
import MapPrinter from './MapPrinter';


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

      if (data.auth) {
        setErrorMsg(data.auth);
      }
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      {errorMsg && <Alert message={errorMsg} type="error" banner closable />}
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
          <Input placeholder="A high-level overview of the Audit Request" />
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
          <Input.TextArea placeholder="A description or summary of the Audit Request." rows={4} />
        </Form.Item>

        <Form.Item
          label="Map URL"
          name="map_url"
          rules={[
            {
              required: true,
              message: 'Please input your map url!',
            },
          ]}
        >
          <Input placeholder="Copy the map URL from your GIS site and paste here" type="url" />
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
    history.push(`/audits/${audit.id}`);
  };

  return (
    <React.Fragment>
      <Layout.Content>
        <Card title="New Audit Request">
          <div className="audit-create-steps">
            <Steps current={current} size="small">
              <Step title="Create" />
              <Step title="Verify" />
            </Steps>
          </div>
          <Row>
            <Col span={16} offset={4}>
              <div className="audit-create-step">
                {current === 0 && <AuditForm onComplete={onComplete} />}
                {current === 1 && <MapPrinter auditId={audit.id} document={audit.documents[0]} onComplete={onVerify} version={1} renderNextButton />}
              </div>
            </Col>
          </Row>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default PostCreateView;
