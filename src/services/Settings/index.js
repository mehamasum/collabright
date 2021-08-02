import React, { useEffect, useState } from "react";
import { Button, Card, Input, message, Tag, Form, Alert, Spin } from 'antd';
import useFetch from 'use-http';
import { Tabs } from 'antd';

const { TabPane } = Tabs;

function callback(key) {
  console.log(key);
}

const OrgSettings = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { get, patch, response } = useFetch();

  useEffect(() => {
    get('/api/v1/organizations/').then(res => {
      if (response.ok) {
        console.log(res);
        setData(res.results[0]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(false);
      setError({
        non_field_errors: ['This account doesnot belong an Organization']
      });
    });
  }, []);

  const onFinish = values => {
    patch(`/api/v1/organizations/${data.id}/`, values).then(res => {
      if (response.ok) {
        message.success('Organization updated!');
        setError(null);
        return;
      }
      message.error('Organization update failed!');
      setError(res);
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  if (error?.non_field_errors) return <Alert message={error.non_field_errors[0]} type="error" showIcon />

  if (loading) return <div className="full-page-loader"><Spin size="large" /></div>;

  console.log(data);

  return (
    <>
      <Form
        name="organization"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={data ? data : {}}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          name="name"
          label="Organization Name"
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: { span: 8, offset: 0 },
          }}
          rules={[
            {
              required: true,
              message: 'Please input name for this organization!',
            },
          ]}
        >
          <Input placeholder="Organization Name" />
        </Form.Item>

        <Form.Item
          name="gis_base_url"
          label="GIS Application URL"
          help={error?.gis_base_url}
          validateStatus={error?.gis_base_url && 'error'}
        >
          <Input placeholder="https://company.maps.arcgis.com" />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: { span: 16, offset: 8 },
          }}
        >
          <Button type="primary" htmlType="submit" loading={loading}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

const Settings = () => {
  return <Card title="Settings">
    <OrgSettings></OrgSettings>
  </Card>
}

export default Settings;