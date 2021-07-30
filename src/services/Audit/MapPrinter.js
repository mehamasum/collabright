import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography, Button } from 'antd';

import useFetch from 'use-http';
import { loadModules } from 'esri-loader';

const { Text } = Typography;

const MapPrinter = ({ auditId, version, onComplete, renderNextButton }) => {
  const globalJSON = JSON;
  const { get, post, response } = useFetch();
  const [ loading, setLoading ] = useState(true);
  
  useEffect(() => {
    loadModules([
      "esri/map",
      "esri/arcgis/utils",
      "esri/tasks/PrintParameters",
      "esri/tasks/PrintTask", "dojo/_base/json"
    ])
    .then(([
      Map,
      arcgisUtils,
      PrintParameters,
      PrintTask,
      JSON
    ]) => {
      get(`/api/v1/arcgis/get_map/?audit_id=${auditId}&version=${version}`).then(data => {
        if (response.ok) {
          const webmap = arcgisUtils.createMap(data, "mapNode");
          webmap.then(function(resp) {
            const map = resp.map;
            const printTask = new PrintTask();
            const printParams = new PrintParameters();
            printParams.map = map;

            setTimeout(() => {
              const Web_Map_as_JSON = JSON.toJson(printTask._getPrintDefinition(map, printParams));
              console.log('native', Web_Map_as_JSON);
              post(`/api/v1/arcgis/update_map_print_definition/?audit_id=${auditId}&version=1`, {
                map_print_definition: Web_Map_as_JSON
              }).then(update => {
                setLoading(false);
                !renderNextButton && onComplete(update);
              });
            }, 5000);
          });
        }
      });
    })
    .catch(err => {
      console.error(err);
    });
  }, []);

  return (
    <>
      <Text strong>Building v{version}.0 of map</Text>
      <div id="mapNode" className="map-verify"></div>
      {renderNextButton && <Button type="primary" onClick={onComplete} loading={loading}>
        Continue
      </Button>}
    </>
  )
}

export default MapPrinter;