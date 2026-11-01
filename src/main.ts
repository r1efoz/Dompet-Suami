import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

// iOS standalone ignores user-scalable=no; block pinch gestures explicitly.
document.addEventListener('gesturestart', (e) => e.preventDefault());

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
