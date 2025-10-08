import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LightNodeProvider } from "@waku/react";

// Set the Light Node options with proper bootstrap configuration
const NODE_OPTIONS = { 
  defaultBootstrap: true,
  // Additional configuration for better connectivity
  libp2p: {
    // Allow local development addresses
    filterMultiaddrs: false,
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LightNodeProvider options={NODE_OPTIONS}>
      <App />
    </LightNodeProvider>
  </React.StrictMode>,
);


