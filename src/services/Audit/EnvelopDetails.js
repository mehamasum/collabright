import React from 'react';
import { Typography, Button, Space, Tooltip, List, Popconfirm } from 'antd';
import { SendOutlined, LinkOutlined } from '@ant-design/icons';
import useFetch from 'use-http';
import './AuditDetails.css';
import { message } from 'antd';
import { GreenTick, Warning } from '../../components/icons';

const { Text } = Typography;

const SendEnvelop = ({ audit }) => {
  const { post, response, loading } = useFetch();

  const sendEnvelop = () => {
    post(`/api/v1/audits/${audit.id}/send_envelop/`).then(data => {
      if (response.ok) {
        message.success('Envelope is sent!');
        window.location.reload(false);
      }

      console.error(data);
    });
  }

  const hasEnvelop = !!audit.envelope_id;
  const signers = audit.reviewers.filter(reviewer => reviewer.needs_to_sign);
  const hasSigners = signers.length > 0;
  const allSignersApproved = signers.every(val => val.verdict === 'APPROVED');
  const isEnvelopSent = audit.status === 'sent';

  return (
    <>
      {(hasEnvelop && hasSigners) &&
        <Tooltip title="You can only send out the envelope once all Signers have aprroved the Audit">
          <Button
            onClick={sendEnvelop}
            loading={loading}
            disabled={!allSignersApproved || isEnvelopSent}
          >
            <SendOutlined /> Send Agreement
          </Button>
        </Tooltip>
      }
    </>
  );
};

const EnvelopDetails = ({ isAdmin, audit, latestDocument, needsToSign }) => {
  const { get, response, loading } = useFetch();

  const getEnvelopSenderView = () => {
    get(`/api/v1/audits/${audit.id}/docusign_sender_view/`).then(data => {
      if (response.ok) {
        window.location.assign(data.url);
      }
    });
  }

  const hasEnvelop = !!audit.envelope_id;
  const isEnvelopSent = audit.status === 'sent';

  return (
    <List
      header={
        <Space>
          <Text strong>Agreement Envelop</Text>
          {((isAdmin || needsToSign) && hasEnvelop) && (isEnvelopSent ? <Text type="success"><GreenTick /> Sent</Text> : <Text type="warning"><Warning /> Draft</Text>)}
          {(isAdmin && hasEnvelop) &&
            <Popconfirm title="Please 'Save and Close' the Envelope when you are done" onConfirm={getEnvelopSenderView}>
              <Button type="link" loading={loading} disabled={isEnvelopSent}>
                <LinkOutlined /> Edit
              </Button>
            </Popconfirm>}
        </Space>}
    >
      <List.Item>
        Audit Details
      </List.Item>
      <List.Item>
        {latestDocument.file && <span>Map PDF &bull; <a href={latestDocument.file} target="_blank" rel="noreferrer">v{audit.documents.length}.0</a></span>}
      </List.Item>
    </List>
  );
};

export default EnvelopDetails;
export { SendEnvelop };
