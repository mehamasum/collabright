import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { useLocation, useParams } from "react-router-dom";
import useFetch from 'use-http';

const OAuthCallback = () => {
  const { integration } = useParams();
  const location = useLocation();
  const code = new URLSearchParams(location.search).get('code');
  const [message, setMessage] = useState("");
  const { post, response, loading } = useFetch();


  useEffect(() => {
    if (!code) return;

    post(`/api/v1/${integration}/verify_oauth/`, { code }).then(data => {
      if (response.ok) {
        setMessage('Authrization Successful');
        setTimeout(() => {
          window.opener && window.opener.location.reload();
          window.close();
        }, 1000);
        return;
      }

      setMessage('Authrization Failed');
    });
  }, [code]);

  return (
    <Card title={`${integration.toUpperCase()} Login`}>
      {loading ? <Spin size="large" spinning={loading} /> : message}
    </Card>
  );
};

export default OAuthCallback;