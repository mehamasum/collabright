import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col, Divider } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import useFetch from 'use-http';
import SearchAuditor from './SearchAuditor';

const { Text } = Typography;

const AddAuditors = ({ onComplete, auditId }) => {
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

export default AddAuditors;