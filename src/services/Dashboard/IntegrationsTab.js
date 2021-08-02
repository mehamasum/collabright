import React, { useEffect, useState } from "react";

import { Button, Card, Row, Col, Tag, Menu, Dropdown } from 'antd';
import useFetch from 'use-http';

import { DisconnectOutlined, MoreOutlined } from "@ant-design/icons";

import docuSignLogo from "../../assets/icons/docuSign.svg";
import esriLogo from "../../assets/icons/esri-logo.png";
import Banner from "./Banner";
import './IntegrationsTab.css';


const IntegrationsTab = () => {
  const [integrations, setIntegrations] = useState([
    {
      type: 'ARC_GIS',
      url: 'arcgis',
      name: 'Esri ArcGIS',
      logo: esriLogo,
      connected: false,
      is_expired: false,
      ready: true,
    },
    {
      type: 'DOCU_SIGN',
      url: 'docusign',
      name: 'DocuSign',
      logo: docuSignLogo,
      connected: false,
      is_expired: false,
      ready: true,
    },
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
              is_expired: new Date(connected.refresh_expiry_date) < new Date() && new Date(connected.expiry_date) < new Date()
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

  const menu = (isConnected) => (
    <Menu>
      <Menu.Item>Learn More</Menu.Item>
      {isConnected && <Menu.Item danger>Disconnect</Menu.Item>}
    </Menu>
  );

  return (
    <>
      {integrations.find(integration => !integration.connected || integration.is_expired) && <Banner />}
      <div className="integration-list">

        <Row gutter={16}>
          {integrations.map(integration => (
            <Col sm={16} lg={8}>
              <Card
                key={integration.name}
                title={integration.name}
                className="integration-card"
                cover={<img alt="example" src={integration.logo} className="integration-logo" />}
                extra={ <Dropdown overlay={menu(integration.connected)}><Button icon={<MoreOutlined/>} type="text"></Button></Dropdown>}
              >
                <div className="integration-card-body">
                  <div>
                    {
                      integration.connected ? (
                        integration.is_expired ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag>
                      ) : <Tag>Not Connected</Tag>
                    }
                  </div>
                  <br />
                  <div>
                    <Button
                      type="primary"
                      className="integration-connect"
                      disabled={!integration.ready}
                      onClick={onOauthClick(integration.url)}
                    >
                      {integration.connected ? 'Reconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  )
}


export default IntegrationsTab;
