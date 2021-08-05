import React from "react";

import {Button, Card, Space, Tabs, Tag} from 'antd';
import {useHistory, useParams} from "react-router";


import IntegrationsTab from "./Integrations";
import OrgSettings from "./OrgSettings";

const {TabPane} = Tabs;


const OrgTab = () => {
  return (
    <OrgSettings/>
  )
}

const SettingsTabs = props => {
  const history = useHistory();
  const {tab} = useParams();
  const handleTabClick = key => {
    history.push(`/settings/${key}`);
  }

  return (
    <Tabs onChange={handleTabClick} activeKey={tab || 'organization'} type="card">
      <TabPane tab="Organization" key="organization">
        <OrgTab/>
      </TabPane>
      <TabPane tab="Integrations" key="integrations">
        <IntegrationsTab/>
      </TabPane>
    </Tabs>
  )
};


export default SettingsTabs;