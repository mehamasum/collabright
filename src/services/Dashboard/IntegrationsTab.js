import React, {useEffect, useState} from "react";

import {Button, Card, Form, Input, Modal, Space, Tag} from 'antd';
import useFetch from 'use-http';

import docuSignLogo from "../../assets/icons/docuSign.svg";
import './IntegrationsTab.css';


const IntegrationsTab = () => {
  const [integrations, setIntegrations] = useState([
    {
      type: 'DOCU_SIGN',
      url: 'docusign',
      name: 'Docu Sign',
      logo: docuSignLogo,
      connected: false,
      is_expired: false,
      ready: true,
    },
    {
      type: 'ARC_GIS',
      url: 'arcgis',
      name: 'Esri ArcGIS',
      logo: 'https://www.arcgis.com/graphics/arcgis-online-icon.png',
      connected: false,
      is_expired: false,
      ready: true,
    }
  ]);
  const { get, response, loading } = useFetch();

  useEffect(() => {
    get('/api/v1/integrations/').then(data => {
      if (response.ok) {
        const updated = integrations.map((item) => {
          const connected = data.results.find(integration => integration.type === item.type);
          if (connected) {
            return {
              ...item,
              connected: true,
              is_expired: new Date(connected.refresh_expiry_date) < new Date() || new Date(connected.expiry_date) < new Date()
            }
          }
          return item;
        });
        setIntegrations(updated);
      }
    });
  }, []);

  const onOauthClick = (type) => () => {
    get(`/api/v1/${type}/oauth_url/`).then(data => {
      if (response.ok) {
        window.open(data.url, "Popup", "width=400,height=600");
      }
    });
  }; 

  return (
    <div className="integration-list">
      <Space>
        {integrations.map(integration => (
          <Card
            key={integration.name}
            hoverable
            className="integration-card"
            cover={<img alt="example" src={integration.logo} className="integration-logo"/>}
          >
            <div className="integration-card-body">
              <div>
                {
                  integration.connected ? (
                    integration.is_expired ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag>
                  ) : <Tag>Not Connected</Tag>
                }
              </div>
              <br/>
              <div>
                <Button
                  type="primary"
                  className="integration-connect"
                  disabled={!integration.ready}
                  onClick={onOauthClick(integration.url)}
                >
                  Connect {integration.name}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </Space>
    </div>
  )
}


export default IntegrationsTab;
