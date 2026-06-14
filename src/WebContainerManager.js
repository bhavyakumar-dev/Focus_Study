import { WebContainer } from '@webcontainer/api';

/** @type {WebContainer}  */
let webcontainerInstance = null;

export async function getWebContainer() {
  if (!webcontainerInstance) {
    try {
      webcontainerInstance = await WebContainer.boot();
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
