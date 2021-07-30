import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col, Divider } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import { useHistory } from "react-router-dom";
import useFetch from 'use-http';
import { loadModules } from 'esri-loader';
import MapPrinter from './MapPrinter';
import SearchAuditor from './SearchAuditor';

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




const ReviewerForm = ({ onComplete, auditId }) => {
  const [ signers, setSigners ] = useState([]);
  const [ reviewers, setReviewers ] = useState([]);
  const { post, response, loading } = useFetch();

  const setAuditors = () => {
    const body = [];
    reviewers.forEach(reviewer => {
      body.push({
        email: reviewer,
        needs_to_sign: false
      });
    });
    signers.forEach(signer => {
      body.push({
        email: signer,
        needs_to_sign: true
      });
    });
    console.log({body});
    post(`/api/v1/audits/${auditId}/add_reviewers/`, body).then(data => {
      if(response.ok) {
        return onComplete();
      }
      console.error(data);
    })
  }

  return (
    <>
      <Text strong>Please add Auditors using their email addresses</Text>
      <Divider/>
      <div>
        <Text strong>Reviewers</Text><br/>
        <SearchAuditor className="search-auditor" onChange={setReviewers}/>
        <br/>
        <br/>
        <Text strong>Signers</Text><br/>
        <SearchAuditor className="search-auditor" onChange={setSigners}/>
      </div>
      <Divider/>
      <Button type="primary" onClick={setAuditors}>
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
              <Step title="Create" />
              <Step title="Verify" />
              <Step title="Add Reviewers" />
            </Steps>
          </div>
          <Row>
            <Col span={16} offset={4}>
              <div className="audit-create-step">
                { current === 0 && <AuditForm onComplete={onComplete} />}
                { current === 1 && <MapPrinter auditId={audit.id} onComplete={onVerify} version={1} renderNextButton/>}
                { current === 2 && <ReviewerForm auditId={audit.id} onComplete={onFinish}/>}
              </div>
            </Col>
          </Row>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default PostCreateView;