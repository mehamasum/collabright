import React, {useEffect, useState} from 'react';
import useFetch from 'use-http';
import {Avatar, Button, Card, Space, Table, Tag, Typography} from 'antd';
import {Link, useParams, useHistory} from "react-router-dom";
import {StopOutlined, CloseOutlined, IssuesCloseOutlined} from '@ant-design/icons';
import {formatRelativeTime, truncateString} from '../../utils';
import AuditDetails from './AuditDetails';
import './AuditView.css';

const AuditView = (props) => {
  let { id: auditId } = useParams();
  return (
    <Card className="audit-details-card">
      <AuditDetails isAdmin auditId={auditId}></AuditDetails>
    </Card>
  );
};

export default AuditView;