// Keep the full document available if a browser cannot load the enhancement modules.
setTimeout(()=>{const h=document.documentElement;if(!h.classList.contains('story-ready')&&!h.classList.contains('gl-ready'))h.classList.add('static-story','no-gl')},5000);
