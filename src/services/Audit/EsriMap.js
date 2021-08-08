import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';

import useFetch from 'use-http';
import { loadModules } from 'esri-loader';

import './EsriMap.css';

const EsriMap = ({ className, homeButtonId, documentId, onLoad, isAdmin, query }) => {
  const globalJSON = JSON;
  const { get, response } = useFetch();

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
      "dojo/_base/json",
      "esri/dijit/HomeButton",
    ])
      .then(([
        Map,
        arcgisUtils,
        PrintParameters,
        PrintTask,
        JSON,
        HomeButton
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
          const home = new HomeButton({ map }, homeButtonId);
          home.startup();
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
      <div id={mapDivId} className={`esri-map ${className}`}><div id={homeButtonId}></div></div>
    </>
  )
}

export default EsriMap;

export const EsriTemplate = ({className, homeButtonId, documentId, onLoad, isAdmin, query}) => {
  const embedPath = process.env.NODE_ENV === 'production' ? '/static/esriviewer-lib/index.html' : '/embeds/esriviewer-lib/index.html';

  return (
    <iframe
      className={className}
      title="Esri Map"
      frameBorder="0"
      border="0"
      cellSpacing="0"
      src={`${embedPath}?document_id=${documentId}${isAdmin ? '' : '&' + query}`}>
    </iframe>
  );
}