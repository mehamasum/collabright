import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography, Spin } from 'antd';

import useFetch from 'use-http';
import { loadModules } from 'esri-loader';

const { Text } = Typography;

const EsriMap = ({ className, documentId, onLoad, isAdmin, query }) => {
  const globalJSON = JSON;
  const { get, post, response } = useFetch();
  const [loading, setLoading] = useState(true);

  const [document, setDocument] = useState(null);
  const mapDivId = (Math.random() + 1).toString(36).substring(7);

  useEffect(() => {
    get(`/api/v1/documents/${documentId}/${isAdmin ? '' : '?' + query}`).then(data => {
      if (response.ok) {
        setDocument(data);
      }
    });
  }, []);

  useEffect(() => {
    if (!document) return;

    loadModules([
      "esri/map",
      "esri/arcgis/utils",
      "esri/tasks/PrintParameters",
      "esri/tasks/PrintTask",
      "dojo/_base/json"
    ])
      .then(([
        Map,
        arcgisUtils,
        PrintParameters,
        PrintTask,
        JSON
      ]) => {
        const modules = {
          Map,
          arcgisUtils,
          PrintParameters,
          PrintTask,
          JSON
        };
        const webmap = arcgisUtils.createMap({
          item: globalJSON.parse(document.map_item),
          itemData: globalJSON.parse(document.map_item_data)
        }, mapDivId);
        webmap.then(function (resp) {
          const map = resp.map;
          onLoad && onLoad(map, modules);
        });
      })
      .catch(err => {
        console.error(err);
      });
  }, [document]);

  return (
    <>
      {!document && <div className="full-page-loader"><Spin size="large" /></div>}
      <div id={mapDivId} className={className}></div>
    </>
  )
}

export default EsriMap;