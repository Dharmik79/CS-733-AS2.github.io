"use strict";

var canvas;
var gl;

var numPositions = 36;

var positions = [];
var colors = [];
var changeColor;
var rotationMatrix;
var rotationMatrixLoc;
var rotateAxis = false;
var angle = 0.0;
var axis = vec3(0, 0, 1);

var trackingMouse = false;
var trackballMove = false;

var lastPos = [0, 0, 0];
var curx, cury;
var startX, startY;

function trackballView(x, y) {
  var d, a;
  var v = [];

  v[0] = x;
  v[1] = y;

  d = v[0] * v[0] + v[1] * v[1];
  if (d < 1.0) v[2] = Math.sqrt(1.0 - d);
  else {
    v[2] = 0.0;
    a = 1.0 / Math.sqrt(d);
    v[0] *= a;
    v[1] *= a;
  }
  return v;
}

function mouseMotion(x, y) {
  var dx, dy, dz;

  var curPos = trackballView(x, y);
  if (trackingMouse) {
    dx = curPos[0] - lastPos[0];
    dy = curPos[1] - lastPos[1];
    dz = curPos[2] - lastPos[2];

    if (dx || dy || dz) {
      angle = -0.9 * Math.sqrt(dx * dx + dy * dy + dz * dz);

      axis[0] = lastPos[1] * curPos[2] - lastPos[2] * curPos[1];
      axis[1] = lastPos[2] * curPos[0] - lastPos[0] * curPos[2];
      axis[2] = lastPos[0] * curPos[1] - lastPos[1] * curPos[0];

      lastPos[0] = curPos[0];
      lastPos[1] = curPos[1];
      lastPos[2] = curPos[2];
    }
  }
  render();
}

function startMotion(x, y) {
  trackingMouse = true;
  startX = x;
  startY = y;
  curx = x;
  cury = y;

  lastPos = trackballView(x, y);
  trackballMove = true;
}

function stopMotion(x, y) {
  trackingMouse = false;
  if (startX != x || startY != y) {
  } else {
    angle = 0.0;
    trackballMove = false;
  }
}
function initColorChange(gl, canvas, color) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(color, color, color, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  rotationMatrix = mat4();
  rotationMatrixLoc = gl.getUniformLocation(program, "uRotationMatrix");
  gl.uniformMatrix4fv(rotationMatrixLoc, true, flatten(rotationMatrix));

  canvas.addEventListener("mousedown", function (event) {
    rotateAxis = false;
    var x = (3 * event.clientX) / canvas.width - 1;
    var y = (3 * (canvas.height - event.clientY)) / canvas.height - 1;
    startMotion(x, y);
  });

  canvas.addEventListener("mouseup", function (event) {
    rotateAxis = false;
    var x = (3 * event.clientX) / canvas.width - 1;
    var y = (3 * (canvas.height - event.clientY)) / canvas.height - 1;
    stopMotion(x, y);
  });

  canvas.addEventListener("mousemove", function (event) {
    // rotateAxis=false
    var x = (3 * event.clientX) / canvas.width - 1;
    var y = (3 * (canvas.height - event.clientY)) / canvas.height - 1;
    mouseMotion(x, y);
  });

  render();
}
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  var buttonColor = document.getElementById("buttonColor");
  var labelColor = document.getElementById("labelColor");

  var myRange = document.getElementById("myRange");
  angle = JSON.parse(myRange.value) * 0.01;
  myRange.oninput = function () {
    angle = JSON.parse(this.value) * 0.01;
  };
  var rotateX = document.getElementById("rotateX");
  rotateX.onclick = function () {
    axis = vec3(1, 0, 0);
    rotateAxis = true;

    rotationMatrix = mat4();
  };
  var rotateY = document.getElementById("rotateY");
  rotateY.onclick = function () {
    axis = vec3(0, 1, 0);
    rotateAxis = true;
    rotationMatrix = mat4();
  };
  var rotateZ = document.getElementById("rotateZ");
  rotateZ.onclick = function () {
    axis = vec3(0.57735, 0.57735, 0.57735);
    rotateAxis = true;

    rotationMatrix = mat4();
  };
  var body = document.getElementById("body");

  var bgColor = 1;
  changeColor = JSON.parse(buttonColor.value);
  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2.0 isn't available");
  }
  buttonColor.onclick = function () {
    changeColor = !JSON.parse(buttonColor.value);
    buttonColor.value = changeColor;
    positions = [];
    colors = [];
    if (changeColor) {
      bgColor = 0;
      body.style.backgroundColor = "black";
      labelColor.style.color = "white";
    } else {
      bgColor = 1;
      body.style.backgroundColor = "white";
      labelColor.style.color = "black";
    }
    colorCube(changeColor);
    initColorChange(gl, canvas, bgColor);
  };

  colorCube(changeColor);

  initColorChange(gl, canvas, bgColor);
};

function colorCube(changeColor) {
  quad(1, 0, 3, 2, changeColor);
  quad(2, 3, 7, 6, changeColor);
  quad(3, 0, 4, 7, changeColor);
  quad(6, 5, 1, 2, changeColor);
  quad(4, 5, 6, 7, changeColor);
  quad(5, 4, 0, 1, changeColor);
}

function quad(a, b, c, d, changeColor) {
  var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
  ];

  var vertexColors = [
    vec4(1.0, 0.5, 0.5, 1.0), //
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(0.0, 1.0, 1.0, 1.0), // cyan
    vec4(1.0, 1.0, 1.0, 1.0), // white
  ];

  // We need to parition the quad into two triangles in order for
  // WebGL to be able to render it.  In this case, we create two
  // triangles from the quad indices

  //vertex color assigned by the index of the vertex

  var indices = [a, b, c, a, c, d];

  for (var i = 0; i < indices.length; ++i) {
    positions.push(vertices[indices[i]]);
    if (changeColor) {
      // for interpolated colors use
      colors.push(vertexColors[indices[i]]);
    } else {
      // for solid colored faces use
      colors.push(vertexColors[a]);
    }
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (trackballMove) {
    axis = normalize(axis);
    if (angle > 0.1) {
      angle = 0.1;
    }
    rotationMatrix = mult(rotationMatrix, rotate(angle, axis));
    gl.uniformMatrix4fv(rotationMatrixLoc, true, flatten(rotationMatrix));
  }
  if (rotateAxis) {
    rotationMatrix = mult(rotationMatrix, rotate(angle, axis));
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));
  }
  gl.drawArrays(gl.TRIANGLES, 0, numPositions);
  requestAnimationFrame(render);
}
