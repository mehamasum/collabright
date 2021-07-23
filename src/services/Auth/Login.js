import './login.css';
import React, {useEffect, useState} from 'react';
import { Form, Input, Button, Layout, Card } from 'antd';
import { Redirect } from "react-router-dom";
import logo from '../../assets/images/logo.svg';
import useFetch from 'use-http';
import { writeStorage } from '@rehooks/local-storage';
import { useLocalStorage } from '@rehooks/local-storage';

const LoginView = () => {
  const [isLoggedIn] = useLocalStorage('token');
  const { post, response, loading } = useFetch();

  const onFinish = values => {
    post('/api/auth/token/login/', values).then(data => {
      if (response.ok) {
        writeStorage('token', data.auth_token);
      }
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  if (isLoggedIn) return <Redirect to={{pathname: '/',}}/>

  return (
    <React.Fragment>
      <Layout className="login-layout">
        <Layout.Content className="login-content">
          <div className="login-app-logo-container"><img src={logo} className="login-app-logo" alt="logo" /></div>
          <Card title="Admin Login" className="login-card">
            <Form
              name="login"
              initialValues={{}}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: 'Please input your username!',
                  },
                ]}
              >
                <Input placeholder="Username"/>
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                ]}
              >
                <Input placeholder="Password" type="password"/>
              </Form.Item>
              <Form.Item >
                <Button type="primary" htmlType="submit" className="login-form-submit" loading={loading}>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Layout.Content>
      </Layout>
    </React.Fragment>
  );
};

export default LoginView;
