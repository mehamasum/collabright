import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography, Button } from 'antd';

import useFetch from 'use-http';
import { loadModules } from 'esri-loader';
import EsriMap from './EsriMap';

const { Text } = Typography;

const MapPrinter = ({ auditId, version, document, onComplete, renderNextButton }) => {
  const globalJSON = JSON;
  const { get, patch, response } = useFetch();
  const [ loading, setLoading ] = useState(true);
  
  const onLoad = (map, modules) => {
    const printTask = new modules.PrintTask();
    const printParams = new modules.PrintParameters();
    printParams.map = map;

    setTimeout(() => {
      const Web_Map_as_JSON = modules.JSON.toJson(printTask._getPrintDefinition(map, printParams));
      console.log('native', Web_Map_as_JSON);
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
      <Text strong>Building v{version}.0 of map</Text>
      <EsriMap className="map-verify" documentId={document.id} onLoad={onLoad}/>
      {renderNextButton && <Button type="primary" onClick={onComplete} loading={loading}>
        Continue
      </Button>}
    </>
  )
}

export default MapPrinter;