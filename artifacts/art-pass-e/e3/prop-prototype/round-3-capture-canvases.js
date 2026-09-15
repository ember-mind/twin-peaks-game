/* Reuse the repository Chrome/SwiftShader capture driver and export the actual
 * canvases before its ordinary page screenshot. No alternate prop painter. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const driverPath = path.join(root, 'test/capture-chrome.js');
const source = fs.readFileSync(driverPath, 'utf8').replace(/^#![^\n]*\n/, '');
const marker = "    const shot = await cdp.send('Page.captureScreenshot', {";
if (!source.includes(marker)) throw new Error('Capture driver hook changed');
const exportCode = `
    for (const [id, name] of [['scene', 'roadhouse-integrated-preview.png'], ['catalog', 'world-builder-catalog-preview.png']]) {
      const dataUrl = await cdp.evaluate('document.getElementById(' + JSON.stringify(id) + ').toDataURL("image/png")');
      fs.writeFileSync(path.join(path.dirname(options.output), name), Buffer.from(dataUrl.split(',')[1], 'base64'));
    }
`;
let instrumented = source.replace(marker, exportCode + marker);
if (process.env.TP_PROP_SOURCE_ROUND === '2') {
  // Load the prior asset through the same painter to obtain an equal-scale,
  // actual-canvas before frame, avoiding CSS screenshot resampling.
  const navigate = "    await cdp.send('Page.navigate', { url: options.url });";
  if (!instrumented.includes(navigate)) throw new Error('Navigation hook changed');
  const redirect = `(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      ...descriptor,
      set(value) { descriptor.set.call(this, String(value).replace('round-3-asset.png', 'round-2-asset.png')); }
    });
  })()`;
  instrumented = instrumented.replace(navigate,
    '    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {source: ' + JSON.stringify(redirect) + '});\n' + navigate);
}
new Function('require', '__dirname', '__filename', instrumented)(require, path.dirname(driverPath), driverPath);
