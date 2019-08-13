function assertType(instanceObject, instance) {
    if(typeof instanceObject === 'string') {
        const instanceObject2 = new String(instanceObject);
        if (!(instanceObject2 instanceof instance)) { //|| !(typeof instanceObject === instance)
            throw new Error(`got type ${typeof instanceObject} but expected ${instance};`);
        }
    } else if (!(instanceObject instanceof instance)) { //|| !(typeof instanceObject === instance)
        throw new Error(`got type ${typeof instanceObject} but expected ${instance};`);
    }
}

function assertFileExtension(pathToFile, reqExtension) {
    if(typeof pathToFile === 'string' && typeof reqExtension === 'string'){
        const fileExtension = pathToFile.slice(-(pathToFile.length - pathToFile.indexOf('.',1)));
        if (fileExtension !== reqExtension) {
            throw new Error(`got extension ${fileExtension} but expected ${reqExtension};`)
        }
    } else {
        throw new Error(`got types ${typeof pathToFile} and ${typeof reqExtension} but expected String;`)
    }
}

class Shader {
    constructor(gl, inputShaderType, shaderSource) {
        let shaderType = (inputShaderType === "VERTEX")? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            const lastError = gl.getShaderInfoLog(shader);
            console.log("*** Error compiling shader '" + shader + "':" + lastError);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    get (){
        return this.shader;
    }
}
class Program {
    constructor(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }
    get(){
        return this.program;
    }
}

class Uniform {
    
    constructor(gl, program, name){
        assertType(gl, WebGL2RenderingContext);
        assertType(program, WebGLProgram);

        const attributeLocation = gl.getAttribLocation(program, name);
        return attributeLocation;
    }

    get() {
        return this.attributeLocation;
    }
}

class ObjFileLoader {
    constructor(pathToFile) {
        assertFileExtension(pathToFile,".obj");
        const output = this;
        const p = new Promise((resolve, reject) => {  

            const xhr = new XMLHttpRequest();
        
            xhr.open("GET", pathToFile);
            xhr.send();
        
            xhr.addEventListener("load", (data) => {
              resolve(data.currentTarget.response);
            });
        });
        p.then(data => {
            const objFile = new OBJFile(data);
            return objFile.parse().models[0];
        }).then(result => output.info = result)
    }

    get() {
        return this.info;
    }
}