import React, { useState } from 'react';
import { Typography, Button } from 'antd';

import useFetch from 'use-http';
import EsriMap from './EsriMap';
import './MapPrinter.css';

const { Text } = Typography;

const MapPrinter = ({ version, document, onComplete, renderNextButton }) => {
  const { patch } = useFetch();
  const [ loading, setLoading ] = useState(true);
  
  const onLoad = (map, modules) => {
    const printTask = new modules.PrintTask();
    const printParams = new modules.PrintParameters();
    printParams.map = map;

    setTimeout(() => {
      const Web_Map_as_JSON = modules.JSON.toJson(printTask._getPrintDefinition(map, printParams));
      patch(`/api/v1/documents/${document.id}/`, {
        map_print_definition: Web_Map_as_JSON
      }).then(update => {
        setLoading(false);
        !renderNextButton && onComplete(update);
      });
    }, 3000);
  }

  return (
    <>
      <Text strong>Fetching v{version}.0 of map</Text>
      <EsriMap className="map-printer" documentId={document.id} onLoad={onLoad} homeButtonId="map-verify-home-btn" isAdmin/>
      {renderNextButton && <Button type="primary" onClick={onComplete} loading={loading}>
        Confirm
      </Button>}
    </>
  )
}

export default MapPrinter;