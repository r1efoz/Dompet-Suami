import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
