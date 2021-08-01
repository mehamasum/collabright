import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Layout, Alert, Form, Input, Button, Row, Col, Divider } from 'antd';
import { Steps, message, Space, Typography } from 'antd';

import useFetch from 'use-http';
import SearchAuditor from './SearchAuditor';

const { Text } = Typography;

const AddAuditors = ({ onComplete, auditId, existingReviewers=[] }) => {
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
      const asReviewer = reviewers.find(reviewer => reviewer.email === signer.email);
      if (asReviewer) {
        asReviewer.needs_to_sign = true;
      } else {
        body.push({
          email: signer,
          needs_to_sign: true
        });
      }
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
        <small><Text type="secondary">People who will only review the Audit</Text></small>
        <SearchAuditor className="search-auditor" onChange={setReviewers} reviewers={existingReviewers.filter(reviewer => !reviewer.needs_to_sign).map(reviewer => reviewer.contact.email)}/>
        <br/>
        <br/>
        <Text strong>Reviewers and Signers</Text><br/>
        <small><Text type="secondary">People who need to sign any uploaded agreements</Text></small>
        <SearchAuditor className="search-auditor" onChange={setSigners} reviewers={existingReviewers.filter(reviewer => reviewer.needs_to_sign).map(reviewer => reviewer.contact.email)}/>
      </div>
      <Divider/>
      <Button type="primary" onClick={setAuditors}>
        Continue
      </Button>
    </>
  )
}

export default AddAuditors;