// Simple test: try to fetch all modules and check for errors
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css'
  };
  
  fs.readFile('.' + filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(8765, () => {
  console.log('Test server running at http://localhost:8765');
  
  // Fetch main.js and check for import errors
  const https = require('https');
  https.get('https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Three.js loaded:', data.length, 'bytes');
      
      // Check if PerspectiveCamera and PointerLockControls are exported
      const hasPerspectiveCamera = data.includes('class PerspectiveCamera') || 
                                   data.includes('PerspectiveCamera');
      const hasPointerLockControls = false; // We'll check the addons separately
      
      console.log('Three.js exports PerspectiveCamera:', hasPerspectiveCamera);
      
      https.get('https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/PointerLockControls.js', (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log('PointerLockControls loaded:', data2.length, 'bytes');
          const hasClassDef = data2.includes('class PointerLockControls') || 
                              data2.includes('export class PointerLockControls');
          console.log('PointerLockControls has class definition:', hasClassDef);
          
          // Check if it imports from three correctly
          const hasThreeImport = data2.includes("from 'three'") || 
                                 data2.includes('from "three"') ||
                                 data2.includes("from \"three\"");
          console.log('PointerLockControls imports from three:', hasThreeImport);
          
          server.close();
        });
      }).on('error', e => console.error('PointerLockControls fetch error:', e.message));
    });
  }).on('error', e => console.error('Three.js fetch error:', e.message));
});
