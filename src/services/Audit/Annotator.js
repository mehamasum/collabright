import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import useFetch from "use-http";


const Annotator = ({document}) => {
  const viewer = useRef(null);
  const documentId = document.id;
  const fileUrl = document.file;

  const user = "John"; // TODO
  const serializer = new XMLSerializer();
  const {post, get, put, del} = useFetch();
  const mapAnnotationToCommnet = {};

  const convertToXfdf = (changedAnnotation, action) => {
    let xfdfString = `<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"><fields />`;
    if (action === 'add') {
      xfdfString += `<add>${changedAnnotation}</add><modify /><delete />`;
    } else if (action === 'modify') {
      xfdfString += `<add /><modify>${changedAnnotation}</modify><delete />`;
    } else if (action === 'delete') {
      xfdfString += `<add /><modify /><delete>${changedAnnotation}</delete>`;
    }
    xfdfString += `</xfdf>`;
    return xfdfString;
  }

  const sendAnnotationChange = async (annotation, action) => {
    if (annotation.nodeType !== annotation.TEXT_NODE) {
      const annotationString = serializer.serializeToString(annotation);
      const annotationId = annotation.getAttribute('name');
      const comment = {
        document: documentId,
        annotation: annotationId,
        xfdf: convertToXfdf(annotationString, action)
      };
      console.log({ annotationId, annotation });
      if (action==='add') {
        const newComment = await post('/api/v1/comments/', comment);
        mapAnnotationToCommnet[annotationId] = newComment.id;
      } else if (action==='modify') {
        const commentId = mapAnnotationToCommnet[annotationId];
        put(`/api/v1/comments/${commentId}/`, comment);
      } else if (action==='delete') {
        const commentId = mapAnnotationToCommnet[annotation.textContent];
        del(`/api/v1/comments/${commentId}/`);
      }
    }
  }

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: fileUrl,
        documentXFDFRetriever: async () => {
          const data = await get(`/api/v1/comments?document=${documentId}`);
          const xfdfs = [];
          data.results.forEach(comment => {
            mapAnnotationToCommnet[comment.annotation] = comment.id;
            xfdfs.push(comment.xfdf);
          });
          return xfdfs;
        },
        disabledElements: [
          'toolbarGroup-View',
          'toolbarGroup-Edit',
          'toolbarGroup-Insert',
          'toolbarGroup-FillAndSign',
          'toolbarGroup-Forms',
          'toolbarGroup-Measure',
        ]
      },
      viewer.current,
    ).then((instance) => {
      instance.UI.openElements(['notesPanel']);
      
      const { documentViewer, annotationManager, Annotations } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        annotationManager.setCurrentUser(user);

        annotationManager.on('annotationChanged', async e => {
          // If annotation change is from import, return
          if (e.imported) {
            return;
          }

          const xfdfString = await annotationManager.exportAnnotCommand();
          // Parse xfdfString to separate multiple annotation changes to individual annotation change
          const parser = new DOMParser();
          const commandData = parser.parseFromString(xfdfString, 'text/xml');
          const addedAnnots = commandData.getElementsByTagName('add')[0];
          const modifiedAnnots = commandData.getElementsByTagName('modify')[0];
          const deletedAnnots = commandData.getElementsByTagName('delete')[0];

          // List of added annotations
          addedAnnots.childNodes.forEach((child) => {
            sendAnnotationChange(child, 'add');
          });

          // List of modified annotations
          modifiedAnnots.childNodes.forEach((child) => {
            sendAnnotationChange(child, 'modify');
          });
          
          // List of deleted annotations
          deletedAnnots.childNodes.forEach((child) => {
            sendAnnotationChange(child, 'delete');
          });
        });
      });
    });
  }, []);

  return (
    <>
      <div className="webviewer" ref={viewer}></div>
    </>
  );
};

export default Annotator;