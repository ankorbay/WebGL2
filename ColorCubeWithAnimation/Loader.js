
class Loader {
  static counter = 0;
  constructor() {
    if (++this.counter > 1) {
      throw new Error("Loader is signleton object");
    }
  }

  loadFile(filePath) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", filePath);
      xhr.send();
  
      xhr.addEventListener("load", data => {
        resolve(xhr.responseText);
      });
  
      xhr.addEventListener("error", data => {
        reject(xhr.statusText, xhr.responseText);
      });
    });
  }

  loadRecursive() {
    let filesData = [];
    let currFile = 0;

    const args = arguments;
    const self = this;

    return new Promise(resolve => {
      function request() {
        if (currFile >= args.length) {
          resolve(filesData);
          return;
        } 
  
        self.loadFile(args[currFile++])
        .then(data => {
          filesData.push(data);
        }) 
        .then(request);
      }

      request();
    });
  }
}

const LoadManager = new Loader();
export default LoadManager;
/**
 * usage exapmle:
 * LoadManager.loadRecursive("./src/Crate1.obj", "./src/Crate1.obj", "./src/Crate1.obj", "./src/Crate1.obj", "./src/Crate1.obj").then(console.log);
 */