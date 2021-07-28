import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import { useHistory } from "react-router-dom";
import useFetch from 'use-http';
import { loadModules } from 'esri-loader';

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
  const globalJSON = JSON;
  const { get, post, response } = useFetch();
  const [ loading, setLoading ] = useState(true);
  
  useEffect(() => {
    loadModules([
      "esri/map",
      "esri/arcgis/utils",
      "esri/tasks/PrintParameters",
      "esri/tasks/PrintTask", "dojo/_base/json"
    ])
    .then(([
      Map,
      arcgisUtils,
      PrintParameters,
      PrintTask,
      JSON
    ]) => {
      get(`/api/v1/arcgis/get_map/?audit_id=${auditId}&version=1`).then(data => {
        if (response.ok) {
          const webmap = arcgisUtils.createMap(data, "mapNode");
          webmap.then(function(resp) {
            const map = resp.map;
            const printTask = new PrintTask();
            const printParams = new PrintParameters();
            printParams.map = map;

            setTimeout(() => {
              const Web_Map_as_JSON = JSON.toJson(printTask._getPrintDefinition(map, printParams));
              console.log('native', Web_Map_as_JSON);
              post(`/api/v1/arcgis/update_map_print_definition/?audit_id=${auditId}&version=1`, {
                map_print_definition: Web_Map_as_JSON
              }).then(update => {
                setLoading(false);
              });
            }, 5000);
          });
        }
      });
    })
    .catch(err => {
      console.error(err);
    });
  }, []);

  return (
    <>
      <Text strong>Building the first version (v1.0) of your map</Text>
      <div id="mapNode" className="map-verify"></div>
      <Button type="primary" onClick={onComplete} loading={loading}>
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
              <Step title="Create" />
              <Step title="Verify" />
              <Step title="Add Reviewers" />
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