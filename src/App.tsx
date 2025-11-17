// FrameMaker Web - Frame-Based Document Editor
import React from 'react';
import { Toolbar } from './ui/Toolbar';
import { Canvas } from './ui/Canvas';
import { useStore } from './core/store';
import './App.css';

const App: React.FC = () => {
  const state = useStore();

  return (
    <div className="framemaker-app">
      <header className="app-header">
        <div className="app-title">
          <span className="logo">⬜</span>
          <h1>FrameMaker Web</h1>
        </div>
        <div className="document-info">
          <span className="doc-name">{state.document.name}</span>
          <span className="doc-modified">
            Modified: {state.document.modified.toLocaleTimeString()}
          </span>
        </div>
      </header>

      <Toolbar />

      <main className="app-main">
        <Canvas />
      </main>

      <footer className="app-footer">
        <div className="footer-left">
          <span>Frames: {state.document.pages[state.currentPageIndex].frames.length}</span>
          <span>
            Page Size: {state.document.pages[state.currentPageIndex].width}×
            {state.document.pages[state.currentPageIndex].height} pt
          </span>
        </div>
        <div className="footer-center">
          <span className="tool-indicator">Tool: {state.activeTool.replace('-', ' ')}</span>
        </div>
        <div className="footer-right">
          <span>Zoom: {state.zoom}%</span>
          {state.showGrid && <span className="indicator">Grid</span>}
          {state.showMargins && <span className="indicator">Margins</span>}
        </div>
      </footer>
    </div>
  );
};

export default App;
