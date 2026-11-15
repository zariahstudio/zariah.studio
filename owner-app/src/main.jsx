import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import {Capacitor} from '@capacitor/core';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
if(!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('/owner/sw.js',{scope:'/owner/'}).catch(console.warn));