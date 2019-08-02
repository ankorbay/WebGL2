"use strict";

var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
`;


function main() {
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromSources(gl,
      [vertexShaderSource, fragmentShaderSource]);

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var timeLocation = gl.getUniformLocation(program, "time");

  var positionBuffer = gl.createBuffer();

  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  setGeometry(gl);

  var size = 3;        
  var type = gl.FLOAT;   
  var normalize = false; 
  var stride = 0;        
  var offset = 0;        
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  gl.enableVertexAttribArray(colorAttributeLocation);

  var size = 3;         
  var type = gl.UNSIGNED_BYTE;  
  var normalize = true;  
  var stride = 0;        
  var offset = 0;        
  gl.vertexAttribPointer(
      colorAttributeLocation, size, type, normalize, stride, offset);


  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var t = new Date();
  
  function drawScene(time) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.uniform1f(timeLocation, time * 0.001);

    var translation = [450+100 * Math.cos(time*0.001), 250+100*Math.sin(time*0.001), 0];
    var rotation = [degToRad(360*Math.sin(time*0.0005)), degToRad(360*Math.sin(time*0.0001)), degToRad(360*Math.sin(time*0.0003))];
    var scaling = [Math.abs(Math.sin(time*0.001)),Math.abs(Math.sin(time*0.001)),Math.abs(Math.sin(time*0.001))];

    var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 800);
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix,scaling[0],scaling[1], scaling[2]);

    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6 * 6;
    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  }
  requestAnimationFrame(drawScene);
}

const OBJFile = require('obj-file-parser');

const fileContents = `
# Blender v2.67 (sub 1) OBJ File: 'Crate1.blend'
# www.blender.org
mtllib Crate1.mtl
o Cube_Cube.001
v -1.000000 -1.000000 1.000000
v -1.000000 -1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 1.000000
v -1.000000 1.000000 -1.000000
v 1.000000 1.000000 -1.000000
v 1.000000 1.000000 1.000000
vt 0.000000 0.000000
vt 1.000000 0.000000
vt 1.000000 1.000000
vt 0.000000 1.000000
usemtl Material.001
s off
f 5/1 6/2 2/3 1/4
f 6/1 7/2 3/3 2/4
f 7/1 8/2 4/3 3/4
f 8/1 5/2 1/3 4/4
f 1/1 2/2 3/3 4/4
f 8/1 7/2 6/3 5/4
`;

const objFile = new OBJFile(fileContents);
 
const output = objFile.parse();

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

// Fill the current ARRAY_BUFFER buffer with colors for the cube.
function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
        50,  70, 0,
        50,  70, 0,
        50,  70, 0,
        50,  70, 0,
        50,  70, 0,
        50,  70, 0,

        80, 70, 50,
        80, 70, 50,
        80, 70, 50,
        80, 70, 50,
        80, 70, 50,
        80, 70, 50,
          
        70, 50, 210,
        70, 50, 210,
        70, 50, 210,
        70, 50, 210,
        70, 50, 210,
        70, 50, 210,

        50, 50, 70,
        50, 50, 70,
        50, 50, 70,
        50, 50, 70,
        50, 50, 70,
        50, 50, 70,

        20, 100, 70,
        20, 100, 70,
        20, 100, 70,
        20, 100, 70,
        20, 100, 70,
        20, 100, 70,

        80, 0, 50,
        80, 0, 50,
        80, 0, 50,
        80, 0, 50,
        80, 0, 50,
        80, 0, 50,
      ]),
      gl.STATIC_DRAW);
}

var m4 = {

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

};

main();
