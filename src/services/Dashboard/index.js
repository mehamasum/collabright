import './index.css';
import { Link } from "react-router-dom";
import { Card, Typography, Alert } from 'antd';
import Banner from "./Banner";
import AuditList from "./AuditList";
import { useEffect, useState } from 'react';
import { useFetch } from 'use-http';

const { Text } = Typography;

const Dashboard = ({ ...props }) => {
  const { get, response, loading } = useFetch();
  const [ connected, setConnected ] = useState(true);

  useEffect(() => {
    get('/api/v1/integrations/').then(data => {
      if (response.ok) {
        console.log(data);
        if(data.count === 0) {
          return setConnected(false);
        }
        const expired = !!data.results.find(integration => new Date(integration.refresh_expiry_date) < new Date() && new Date(integration.expiry_date) < new Date());
        setConnected(expired);
      }
    });
  }, []);
  return (
    <div>
      <Card title="Dashboard">
        <Banner />
        <div className="dash-content">
          {connected && <Alert className="no-integration-alert" 
            message="Integrations are not connected!"
            description={<>Head over to <Link to="/settings/integrations">Settings</Link> to integrate Collabright with your GIS and eSignature platform</>}
            banner
          />}
          <AuditList />
        </div>
      </Card>
    </div>
  )
};


export default Dashboard;
