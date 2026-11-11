import { render } from 'preact';
import { App } from './app/App';
import './app/install';
import './styles/global.css';

render(<App />, document.getElementById('app')!);
