/**
 * Test direct CDP connection to Chrome (tab-level)
 * 
 * Usage: node test-cdp.js
 */

const ws = require('ws');

async function main() {
  // Get list of tabs
  const tabs = await fetch('http://localhost:9222/json').then(r => r.json());
  console.log('Available tabs:');
  tabs.forEach((tab, i) => console.log(`  ${i}: ${tab.url} (type: ${tab.type})`));
  
  // Find a page tab (not browser)
  const pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) {
    console.log('No page tabs found. Open a page in Chrome first!');
    process.exit(1);
  }
  
  console.log('\nConnecting to tab:', pageTab.url);
  console.log('WebSocket:', pageTab.webSocketDebuggerUrl);
  
  const socket = new ws(pageTab.webSocketDebuggerUrl);
  
  let messageId = 1;
  
  socket.on('open', () => {
    console.log('\nConnected to tab!');
    
    // Enable Page domain
    send({ method: 'Page.enable' });
    
    // Navigate after a short delay
    setTimeout(() => {
      send({
        method: 'Page.navigate',
        params: { url: 'https://example.com' }
      });
    }, 500);
  });
  
  socket.on('message', (data) => {
    const response = JSON.parse(data);
    console.log('\n<- Response:', JSON.stringify(response, null, 2));
  });
  
  socket.on('close', () => {
    console.log('\nDisconnected');
    process.exit(0);
  });
  
  socket.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
  
  function send(msg) {
    const message = { id: messageId++, ...msg };
    console.log('\n-> Sending:', JSON.stringify(message));
    socket.send(JSON.stringify(message));
  }
}

main();
