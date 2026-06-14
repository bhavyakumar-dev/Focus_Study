import { WebContainer } from '@webcontainer/api';

/** @type {WebContainer}  */
let webcontainerInstance = null;
let currentServerUrl = null;
let serverUrlListeners = [];

export function onServerReady(callback) {
  serverUrlListeners.push(callback);
  if (currentServerUrl) callback(currentServerUrl);
  return () => {
    serverUrlListeners = serverUrlListeners.filter(cb => cb !== callback);
  };
}

export async function getWebContainer() {
  if (!webcontainerInstance) {
    try {
      webcontainerInstance = await WebContainer.boot();
      webcontainerInstance.on('server-ready', (port, url) => {
        currentServerUrl = url;
        serverUrlListeners.forEach(cb => cb(url));
      });
    } catch (e) {
      console.error('Failed to boot WebContainer. Make sure Cross-Origin Isolation headers are set.', e);
      throw e;
    }
  }
  return webcontainerInstance;
}

/**
 * Syncs an array of files into the WebContainer file system.
 * Expected format: { name: 'main.js', content: '...', id: 1 }
 */
export async function syncFilesToWebContainer(files) {
  const instance = await getWebContainer();
  const fileSystemTree = {};

  files.forEach(f => {
    fileSystemTree[f.name] = {
      file: {
        contents: f.content
      }
    };
  });

  await instance.mount(fileSystemTree);
}
