function assertType(instanceObject, instance) {
    if (!(instanceObject instanceof instance)) { //|| !(typeof instanceObject === instance)
        throw new Error(`got type ${typeof instanceObject} but expected ${instance};`);
    }
  }

class Shader {
    constructor(gl, shaderType, shaderSource) {
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
class ProgramFromSources {
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

class Attribute {
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