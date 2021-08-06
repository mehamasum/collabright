import React, { useState } from 'react';
import { Button, Typography } from 'antd';

import useFetch from 'use-http';
import SearchAuditor from './SearchAuditor';

const { Text } = Typography;

const AddAuditors = ({ onComplete, auditId, existingReviewers = [], showSigners }) => {
  const existingOnlyReviewers = existingReviewers.filter(reviewer => !reviewer.needs_to_sign).map(reviewer => reviewer.contact.email);
  const existingSigners = existingReviewers.filter(reviewer => reviewer.needs_to_sign).map(reviewer => reviewer.contact.email);
  const [signers, setSigners] = useState(existingSigners || []);
  const [reviewers, setReviewers] = useState(existingOnlyReviewers || []);
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
      const asReviewer = body.find(reviewer => reviewer.email === signer);
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
      if (response.ok) {
        return onComplete();
      }
      console.error(data);
    })
  }

  const getView = () => {
    if (showSigners) {
      return (
        <>
          <small><Text type="secondary">People who will review and sign the sent envelop</Text></small>
          <SearchAuditor className="search-auditor" onChange={setSigners} reviewers={existingSigners} />
        </>
      )
    };

    return (
      <>
        <small><Text type="secondary">People who will only review</Text></small>
        <SearchAuditor className="search-auditor" onChange={setReviewers} reviewers={existingOnlyReviewers} />
      </>
    );
  }

  return (
    <>
      <div>{getView()}</div>
      <br />
      <Button type="primary" onClick={setAuditors} loading={loading}>
        Continue
      </Button>
    </>
  )
}

export default AddAuditors;