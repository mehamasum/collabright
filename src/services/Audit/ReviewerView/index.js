import React from 'react';
import { Layout } from 'antd';
import AuditDetails from '../../Audit/AuditDetails';
import logo from '../../../assets/images/logo.svg';
import {
  useParams,
  useLocation
} from "react-router-dom";

import './index.css';

const { Header, Content } = Layout;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ReviewerView = () => {
  let { audit: auditId } = useParams();
  const query = useQuery();

  return (
    <React.Fragment>
      <Layout className="reviewer-layout">
        <Header className="site-header">
          <div className="app-logo">
            <img src={logo} className="App-logo" alt="logo" />
          </div>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className="reviewer-content reviewer-content-full">
            <AuditDetails auditId={auditId} query={query} />
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
