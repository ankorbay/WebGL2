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

class U {
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