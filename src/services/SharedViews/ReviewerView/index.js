import React, {useEffect, useState, useRef} from 'react';
import { Form, Input, Button, Layout, Card, Tabs, Space, Select } from 'antd';
import { loadModules } from "esri-loader";

import './index.css';

const { TabPane } = Tabs;
const { Option } = Select;


const {Header, Sider, Content, Footer} = Layout;

const operations = (
  <Space>
    <Button>Review</Button>
    <Button type="primary">Sign</Button>
  </Space>
);

// hooks allow us to create a map component as a function
function EsriMap({ id }) {
  // create a ref to element to be used as the map's container
  const mapEl = useRef(null);

  // use a side effect to create the map after react has rendered the DOM
  useEffect(
    () => {
      // define the view here so it can be referenced in the clean up function
      let view;
      // the following code is based on this sample:
      // https://developers.arcgis.com/javascript/latest/sample-code/webmap-basic/index.html
      // first lazy-load the esri classes
      loadModules(["esri/views/MapView", "esri/WebMap"], {
        css: true
      }).then(([MapView, WebMap]) => {
        // then we load a web map from an id
        const webmap = new WebMap({
          // autocasts as new PortalItem()
          portalItem: {
            // get item id from the props
            id
          }
        });

        // and we show that map in a container
        view = new MapView({
          map: webmap,
          // use the ref as a container
          container: mapEl.current
        });
      });
      return () => {
        // clean up the map view
        if (!!view) {
          view.destroy();
          view = null;
        }
      };
    },
    // only re-load the map if the id has changed
    [id]
  );
  return <div style={{ height: 400 }} ref={mapEl} />;
}

const ReviewerView = () => {
  const [key, setKey] = useState(4); // tab key

  function callback(key) {
    setKey(key);
  }

  function handleChange(value) {
    console.log(`selected ${value}`);
  }

  return (
    <React.Fragment>
      <Layout className="reviewer-layout">
        <Header className="site-header">
          <Space>
            Audit Review
            <Select defaultValue="2" style={{ width: 120 }} onChange={handleChange}>
              <Option value="2">v2 (Latest)</Option>
              <Option value="1">v1</Option>
            </Select>
          </Space>
        </Header>
        <Content className="reviewer-content-wrapper">
          <div className={`reviewer-content ${key==2 ? 'reviewer-content-full' : ''}`}>
            <Tabs defaultActiveKey="4" onChange={callback} tabBarExtraContent={operations}>
              <TabPane tab="Details" key="4">
                Details
              </TabPane>
              <TabPane tab="Interactive Map" key="1">
                <EsriMap id="e691172598f04ea8881cd2a4adaa45ba" />
              </TabPane>
              <TabPane tab="Comments" key="2">
                Comments
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </React.Fragment>
  );
};

export default ReviewerView;
