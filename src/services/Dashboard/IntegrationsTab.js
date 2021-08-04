import React, { useEffect, useState } from "react";

import { Button, Card, Row, Col, Tag, Menu, Dropdown, Typography, Badge, Space } from 'antd';
import useFetch from 'use-http';

import { DisconnectOutlined, MoreOutlined } from "@ant-design/icons";

import docuSignLogo from "../../assets/icons/docuSign.svg";
import esriLogo from "../../assets/icons/esri-logo.png";
import Banner from "./Banner";
import './IntegrationsTab.css';
import { formatRelativeTime } from "../../utils";
import { RedCross, GreenTick } from "../../components/icons";


const {Text} = Typography;

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
              is_expired: new Date(connected.refresh_expiry_date) < new Date() && new Date(connected.expiry_date) < new Date(),
              expires_at: connected.refresh_expiry_date || connected.expiry_date,
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
      <Banner />
      <div className="integration-list">

        <Row gutter={16}>
          {integrations.map(integration => (
            <Col sm={16} lg={8}>
              <Card
                key={integration.name}
                title={<><Text>{integration.name}</Text> &nbsp; {integration.is_expired ? <RedCross/> : integration.connected ? <GreenTick/> : null}</>}
                className="integration-card"
                cover={<img alt="example" src={integration.logo} className="integration-logo" />}
                extra={ <Dropdown overlay={menu(integration.connected)}><Button icon={<MoreOutlined/>} type="text"></Button></Dropdown>}
              >
                <div className="integration-card-body">
                  <Text type="secondary">{integration.connected ? `Expires ${formatRelativeTime(integration.expires_at)}` : 'Not Connected'}</Text>
                  <br/>
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
