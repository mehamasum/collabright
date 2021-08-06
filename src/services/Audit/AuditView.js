import React from 'react';
import { useParams } from "react-router-dom";
import AuditDetails from './AuditDetails';
import './AuditView.css';

const AuditView = (props) => {
  let { id: auditId } = useParams();
  return (
    <AuditDetails isAdmin auditId={auditId}></AuditDetails>
  );
};

export default AuditView;