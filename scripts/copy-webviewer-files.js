const fs = require('fs-extra');

const copyFiles = async () => {
  try {
    // TODO: delete unnecessary files
    await fs.copy('./node_modules/@pdftron/webviewer/public', './public/webviewer/webviewer-lib');
    console.log('WebViewer files copied over successfully');

    await fs.copy('./Viewer/build', './public/embeds/esriviewer-lib');
    console.log('Esri Viewer files copied over successfully');
  } catch (err) {
    console.error(err);
  }
};

copyFiles();