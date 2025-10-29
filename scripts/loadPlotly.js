// scripts/loadPlotly.js
// Simple loader that injects Plotly from CDN and returns a Promise that resolves when ready.
const CDN = 'https://cdn.plot.ly/plotly-2.35.3.min.js';

function injectScript(src){
  return new Promise((resolve, reject)=>{
    if(typeof window === 'undefined') return reject(new Error('no window'));
    // already loaded
    if(window.Plotly && typeof window.Plotly.newPlot === 'function') return resolve(window.Plotly);
    // check existing script
    const existing = Array.from(document.getElementsByTagName('script')).find(s=> s.src && s.src.indexOf('plotly') !== -1);
    if(existing){
      existing.addEventListener('load', ()=> resolve(window.Plotly));
      existing.addEventListener('error', ()=> reject(new Error('failed to load existing script')));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = ()=> resolve(window.Plotly);
    s.onerror = (e)=> reject(new Error('failed to load plotly'));
    document.head.appendChild(s);
  });
}

module.exports = {
  loadPlotly: function(){
    if(typeof window === 'undefined') return Promise.reject(new Error('no window'));
    if(window.Plotly && typeof window.Plotly.newPlot === 'function'){
      try{ window.dispatchEvent(new CustomEvent('plotly-ready',{detail:{ts:Date.now(), from:'cached'}})); }catch(e){}
      return Promise.resolve(window.Plotly);
    }
    const start = Date.now();
    return injectScript(CDN).then(p=>{
      try{ window.dispatchEvent(new CustomEvent('plotly-ready',{detail:{ts:Date.now(), latency: Date.now()-start, from:'cdn'}})); }catch(e){}
      return p;
    });
  }
};
