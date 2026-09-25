import '@fontsource-variable/plus-jakarta-sans';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import { startApp } from './app';

const root = document.getElementById('app');
if (root) startApp(root);
