import React, { useEffect, useState } from 'react';
import { Typography, Spin, Button, Tag, Tabs, Space, Select, PageHeader, Menu, Dropdown, Input, Tooltip } from 'antd';
import { EyeOutlined, SendOutlined, LinkOutlined } from '@ant-design/icons';
import Annotator from './Annotator';
import useFetch from 'use-http';
import { Row, Col, List, Badge, Divider, Modal } from 'antd';
import { formatRelativeTime, truncateString } from '../../utils';
import MapPrinter from './MapPrinter';
import AddAuditors from './AddAuditors';
import './AuditDetails.css';
import { message } from 'antd';
import EsriMap from './EsriMap';
import { RedCross, GreenTick, Warning } from '../../components/icons';
import {useHistory, useParams} from "react-router";
import { Link } from 'react-router-dom';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const EnvelopDetails = ({isAdmin, audit, latestDocument, needsToSign}) => {
  const { get, post, response, loading } = useFetch();

  const getEnvelopSenderView = () => {
    get(`/api/v1/audits/${audit.id}/docusign_sender_view/`).then(data => {
      if (response.ok) {
        window.location.assign(data.url);
      }
    });
  }

  const sendEnvelop = () => {
    post(`/api/v1/audits/${audit.id}/send_envelop/`).then(data => {
      if (response.ok) {
        message.success('Envelop is sent!');
        window.location.reload(false);
      }

      console.error(data);
    });
  }

  const hasAgreement = !!audit.agreement;
  const hasEnvelop = !!audit.envelope_id;
  const signers = audit.reviewers.filter(reviewer => reviewer.needs_to_sign);
  const hasSigners = signers.length > 0;
  const docuSignEnvelopEditUrl = `https://appdemo.docusign.com/prepare/${audit.envelope_id}/`;
  const isEnvelopSent = audit.status === 'sent';

  console.error({isAdmin ,needsToSign, hasEnvelop, isEnvelopSent}, ((isAdmin || needsToSign) && hasEnvelop))

  return (
    <List
      header={
      <Space>
        <Text strong>Envelop Details</Text>
        {((isAdmin || needsToSign) && hasEnvelop)  &&  (isEnvelopSent ? <Text type="success"><GreenTick/> Sent</Text> : <Text type="warning"><Warning/> Draft</Text>)}
        {(isAdmin && hasEnvelop) && <Button type="link" onClick={getEnvelopSenderView} loading={loading} disabled={isEnvelopSent}><LinkOutlined/> Edit</Button>}
        {(isAdmin && hasEnvelop && hasSigners) && <Button type="link" onClick={sendEnvelop} loading={loading} disabled={isEnvelopSent}><SendOutlined/> Send</Button>}
      </Space>}
    >
      <List.Item>
        Audit Details
      </List.Item>
      <List.Item>
      <Space><span>Map &bull; v{audit.documents.length}.0</span> {latestDocument.file && <a href={latestDocument.file} target="_blank"><EyeOutlined/> View</a>}</Space>
      </List.Item>
    </List>
  );
};

export default EnvelopDetails;