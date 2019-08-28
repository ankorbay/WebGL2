import LoadManager from "./Loader.js";

"use strict";

var vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec3 a_normal;
 
uniform mat4 u_matrix;
uniform mat4 u_world;
 
out vec3 v_normal;
 
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
 
  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_world) * a_normal;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
 
  float light = dot(normal, u_reverseLightDirection);
  
  outColor = u_color;

  outColor.rgb *= light;
}
`;

function parseObj(data) {
  return new Promise((resolve, reject) => {
    const objFileData = new OBJFile(String(data));
      resolve(objFileData.parse());
  })
}

function main() {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  
  if (!gl || !(gl instanceof WebGL2RenderingContext)) {
    throw new Error('WebGL context is not defined');
  }
  const vertexShader = new Shader(gl,'VERTEX',vertexShaderSource);
  const fragmentShader = new Shader(gl,'FRAGMENT',fragmentShaderSource);

  const program = new Program(gl,vertexShader,fragmentShader);

  LoadManager.loadRecursive("./src/Crate1.obj")
    .then(parseObj)
    .then(parsedData => console.log(parsedData));

  // const parsedObj = new FileLoader("./src/Crate1.obj");
  // console.log(parsedObj);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  // const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  const normalLocation = gl.getAttribLocation(program, "a_normal");
  
  const worldViewProjectionLocation = gl.getUniformLocation(program, "u_matrix");

  var worldLocation = gl.getUniformLocation(program, "u_world");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");
  
  const vao = gl.createVertexArray();
  
  const positionBuffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);       
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // const colorsBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  // setColors(gl); 
  // gl.enableVertexAttribArray(colorAttributeLocation);       
  // gl.vertexAttribPointer(colorAttributeLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  const normalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  setNormals(gl);
  gl.enableVertexAttribArray(normalLocation); 
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);


  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  const fieldOfViewRadians = degToRad(100);
  const cameraAngleRadians = degToRad(100);

  let fRotationRadians = 0;
  
  const cameraPosition = [200,300,100];

  document.addEventListener('keypress', moveCam);

  function moveCam(e) { // Push to move the cam : A - left, D - right, W - forward, S - back, P - up, L - down
    if(e.code==="KeyS"){
      cameraPosition[2] -= 50;
      console.log(cameraPosition.toString());
    } else if(e.code==="KeyW"){
      cameraPosition[2] += 50;
      console.log(cameraPosition.toString());
    } else if(e.code==="KeyA"){
      cameraPosition[0] -= 50;
      console.log(cameraPosition.toString());
    } else if(e.code==="KeyD"){
      cameraPosition[0] += 50;
      console.log(cameraPosition.toString());
    } else if(e.code==="KeyP"){
      cameraPosition[1] += 50;
      console.log(cameraPosition.toString());
    } else if(e.code==="KeyL"){
      cameraPosition[1] -= 50;
      console.log(cameraPosition.toString());
    }
  }
  console.log(`Camera is ON. Start position is: [${cameraPosition.toString()}]/n
  Use keyboard W/A/S/D and P/L to move it fwd/left/back/back and up/down respectively`);
  

  function drawScene(time) {
    const radius = 450+100 * Math.cos(time*0.001);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const cubeStartPosition = [450, 250, 100];
    
    let cameraMatrix = m4.yRotation(cameraAngleRadians);
    cameraMatrix = m4.translate(cameraMatrix, 0, 50, radius * 1.5);

    const up = [0, 1, 0];

    cameraMatrix = m4.lookAt(cameraPosition, cubeStartPosition, up);

    const viewMatrix = m4.inverse(cameraMatrix);

    const viewProjectionMatrix = m4.multiply(projectionMatrix,viewMatrix);

    const worldMatrix = m4.yRotation(fRotationRadians);

    const translation = [450+100 * Math.cos(time*0.001), 250+100*Math.sin(time*0.001), 0];
    const rotation = [degToRad(360*Math.sin(time*0.0005)), degToRad(360*Math.sin(time*0.0001)), degToRad(360*Math.sin(time*0.0003))];
    const scaling = [Math.abs(Math.sin(time*0.001)),Math.abs(Math.sin(time*0.001)),Math.abs(Math.sin(time*0.001))];

    let matrix = m4.multiply(viewProjectionMatrix, worldMatrix);

    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix,scaling[0],scaling[1], scaling[2]);

    gl.uniformMatrix4fv(worldViewProjectionLocation, false, matrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
    gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
    gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));

    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 6 * 6;
    gl.drawArrays(primitiveType, offset, count);
    
    requestAnimationFrame(drawScene);
  }
  requestAnimationFrame(drawScene);
}

function setNormals(gl, normalsArr) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
 
          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
 
          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
 
          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
 
          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
 
          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

// Construct the cube from triangles
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([

          50, 0,   0,
          50, 50, 0,
          0,   50, 0,
          0,   50, 0,
          0,   0,   0,
          50, 0,   0,


          0,   0,  0,
          50, 0,  0,
          50, 0,  50,
          50, 0,  50,
          0,   0,  50,
          0,   0,  0,

          
          0,   0,   0,
          0,   50, 0,
          0,   50, 50,
          0,   50, 50,
          0,   0,   50,
          0,   0,   0,


          0,   50,  0,
          50, 50,  0,
          50, 50,  50,
          50, 50,  50,
          0,   50,  50,
          0,   50,  0,


          50,   0,   0,
          50,   50,   0,
          50,   50,  50,
          50,   50,  50,
          50,   0,  50,
          50,   0,  0,

          0,   0,   50,
          0,   50, 50,
          50, 50, 50,
          50, 50, 50,
          50, 0,   50,
          0,   0,   50,
      ]),
      gl.STATIC_DRAW);
}

// // Fill the current ARRAY_BUFFER buffer with colors for the cube.
// function setColors(gl) {
//   gl.bufferData(
//       gl.ARRAY_BUFFER,
//       new Uint8Array([
//         50,  70, 0,
//         50,  70, 0,
//         50,  70, 0,
//         50,  70, 0,
//         50,  70, 0,
//         50,  70, 0,

//         80, 70, 50,
//         80, 70, 50,
//         80, 70, 50,
//         80, 70, 50,
//         80, 70, 50,
//         80, 70, 50,
          
//         70, 50, 210,
//         70, 50, 210,
//         70, 50, 210,
//         70, 50, 210,
//         70, 50, 210,
//         70, 50, 210,

//         50, 50, 70,
//         50, 50, 70,
//         50, 50, 70,
//         50, 50, 70,
//         50, 50, 70,
//         50, 50, 70,

//         20, 100, 70,
//         20, 100, 70,
//         20, 100, 70,
//         20, 100, 70,
//         20, 100, 70,
//         20, 100, 70,

//         80, 0, 50,
//         80, 0, 50,
//         80, 0, 50,
//         80, 0, 50,
//         80, 0, 50,
//         80, 0, 50,
//       ]),
//       gl.STATIC_DRAW);
// }

const m4 = {

  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ];
  },

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse: function(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
             (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
             (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
             (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
             (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
           (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
           (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
           (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
           (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
           (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
           (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
           (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
           (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
           (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
           (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
           (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
           (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    ];
  },

  cross: function(a, b) {
    return [
       a[1] * b[2] - a[2] * b[1],
       a[2] * b[0] - a[0] * b[2],
       a[0] * b[1] - a[1] * b[0],
    ];
  },

  subtractVectors: function(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },

  normalize: function(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },

  lookAt: function(cameraPosition, target, up) {
    var zAxis = m4.normalize(
        m4.subtractVectors(cameraPosition, target));
    var xAxis = m4.normalize(m4.cross(up, zAxis));
    var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },

  transformVector: function(m, v) {
    var dst = [];
    for (var i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (var j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

};

main();
