import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import useFetch from "use-http";
import errorPdf from '../../assets/error.pdf';
import { initializeHTMLViewer } from '@pdftron/webviewer-html';

const Annotator = ({ document, isAdmin, query, user }) => {
  const viewer = useRef(null);
  const documentId = document.id;
  const fileUrl = document.file || errorPdf;

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
        const newComment = await post(`/api/v1/comments/${isAdmin ? '' : '?'+query}`, comment);
        mapAnnotationToCommnet[annotationId] = newComment.id;
      } else if (action==='modify') {
        const commentId = mapAnnotationToCommnet[annotationId];
        put(`/api/v1/comments/${commentId}/${isAdmin ? '' : '?'+query}`, comment);
      } else if (action==='delete') {
        const commentId = mapAnnotationToCommnet[annotation.textContent];
        del(`/api/v1/comments/${commentId}/${isAdmin ? '' : '?'+query}`);
      }
    }
  }

  useEffect(() => {
    WebViewer(
      {
        path: process.env.NODE_ENV === 'production' ? '/static/webviewer-lib' : '/webviewer/webviewer-lib',
        css: process.env.NODE_ENV === 'production' ? '/static/webviewer-css/index.css' : '/webviewer-custom/webviewer-css/index.css',
      },
      viewer.current
    ).then(async (instance) => {
      const { FitMode, Feature } = instance; // instance.core

      instance.setFitMode(FitMode.FitPage);
      // disable built-in search since there is no text layer
      instance.disableFeatures([Feature.Search]);
      // disable text based annotations tools since there is no text layer
      instance.disableElements([
        'viewControlsButton',
        'downloadButton',
        'printButton',
        'highlightToolGroupButton',
        'underlineToolGroupButton',
        'strikeoutToolGroupButton',
        'squigglyToolGroupButton',
        'fileAttachmentToolGroupButton',
        'toolbarGroup-Edit',
        'toolbarGroup-View',
        'toolbarGroup-Insert',
      ]);
      // Extends WebViewer to allow loading HTML5 files from URL or static folder.
      const htmlModule = await initializeHTMLViewer(instance);

      htmlModule.loadHTMLPage(
        `http://localhost:3000/embeds/mapviewer-lib/index.html?document_id=${documentId}${isAdmin ? '' : '&'+query}`,
        1800,
        1000
      );

      const { docViewer: documentViewer, annotManager: annotationManager } = instance;


      documentViewer.on('documentLoaded', async () => {
        const data = await get(`/api/v1/comments?document=${documentId}${isAdmin ? '' : '&'+query}`);
        console.log({comment: data});
        data.results.forEach(async (comment) => {
          mapAnnotationToCommnet[comment.annotation] = comment.id;
          const annotations = await annotationManager.importAnnotCommand(comment.xfdf);
          await annotationManager.drawAnnotationsFromList(annotations);
        });

        annotationManager.setCurrentUser(user);
        instance.openElements(['notesPanel']);

        setTimeout(() => {
          instance.setFitMode(FitMode.FitPage);
        }, 1500);

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

  return <div className="webviewer" ref={viewer}></div>;
};

export default Annotator;