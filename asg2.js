// Srinidhi Somangili
// sksomang@ucsc.edu


// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position; 
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    //gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    gl = getWebGLContext(canvas, false)
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

  // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

  // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // get storage location of matrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    // var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    // if (!u_ViewMatrix) {
    //     console.log('Failed to get the storage location of u_ViewMatrix');
    //     return;
    // }

    // set initial value for this matrix to identity 
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const mydraw = 0;

// globals related to UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_selectedSegs = 6;
let g_globalAngle = 0;
let g_headAngle = 0;
let g_trunkAngle = 0;
let g_bottrunkAngle = 0;
let g_earsangle = 0
let g_bodyangle = 0
let g_animation = false;
let g_xangle = 0;
let g_yangle = 0;

// set up actions for HTML UI elements
function addActionsForHtmlUI() {

    // hor camera angle
    document.getElementById('horangleSlide').addEventListener('mousemove', function () { g_xangle = this.value; renderAllShapes(); });

    // ver camera angle
    document.getElementById('verangleSlide').addEventListener('mousemove', function () { g_yangle = this.value; renderAllShapes(); });

    // head angle
    document.getElementById('head').addEventListener('mousemove', function () { g_headAngle = this.value; renderAllShapes(); });

    // trunk angle
    document.getElementById('trunk').addEventListener('mousemove', function () { g_trunkAngle = this.value; renderAllShapes(); });

    // bot trunk
    document.getElementById('bottrunk').addEventListener('mousemove', function () { g_bottrunkAngle = this.value; renderAllShapes(); });

    // ears angle
    document.getElementById('ears').addEventListener('mousemove', function () { g_earsangle = this.value; renderAllShapes(); });

     // body angle
     document.getElementById('body').addEventListener('mousemove', function () { g_bodyangle = this.value; renderAllShapes(); });

    
    document.getElementById('animationon').onclick = function() { g_animation = true; };
    document.getElementById('animationoff').onclick = function() { g_animation = false; };
}

function main() {
  
    // set up canvas and GL vars
    setupWebGL();
    // set up GLSL shaders programs + connect GLSL vars
    connectVariablesToGLSL();

    // set up actions for HTML UI elements
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    // canvas.onmousedown = click;
    // //canvas.onmousemove = click;
    // canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };

    canvas.onmousemove = function(ev) { if (ev.buttons == 1) { cammove(ev); } };
    //canvas.onmousedown = function(ev) { if (ev.shiftKey) { g_specialAnimation = true;}};


    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);  

    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
    g_seconds = performance.now()/1000.0-g_startTime;
    //console.log(g_seconds);
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);

}

let headAngle = 0;
let bodyangle = 0
let trunkangle = 0
let earsangle = 0
let bottrunk = 0;
let trunkSwingDirection = 1;

function updateAnimationAngles() {
    if (g_animation) {
        headAngle = 15*Math.sin(g_seconds);
        trunkangle = 8*Math.sin(g_seconds);
        earsangle = 30*Math.sin(g_seconds);
        bodyangle = 10*Math.sin(g_seconds);
        bottrunk = 10*Math.sin(g_seconds);
    }
    else {
        headAngle = g_headAngle;
        trunkangle = g_trunkAngle;
        earsangle = g_earsangle
        bodyangle = g_bodyangle
        bottrunk = g_bottrunkAngle
    }
}
var g_shapesList = [];

function click(ev) {
  
    // extract event click + return it in WebGL coords
    let [x,y] = convertCoordinatesEventToGL(ev);

    // create + store new point
    let point;
    if (g_selectedType==POINT) {
        point = new Point();
    } else if (g_selectedType==TRIANGLE) {
        point = new Triangle();
    } else {
        point = new Circle();
        point.segments = g_selectedSegs;
    }
    point.position=[x, y];
    point.color = g_selectedColor.slice()
    point.size = g_selectedSize;
    g_shapesList.push(point)


    // draw every shape that should be in canvas
    renderAllShapes();
}

let rotateanglex = 0;
let rotateangley = 0;

function cammove(ev){
    rotateanglex += ev.movementX;
    rotateangley += ev.movementY;
  }

// extract event click + return it in WebGL coords
function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x, y]);
}


function sendTextToHTML(text, htmlID) {
    var htmlEm = document.getElementById(htmlID);
    if (!htmlEm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlEm.innerHTML = text;
}

var startTime = performance.now();

// draw every shape that should be in canvas
function renderAllShapes() {
    // check start time
    var startTime = performance.now();

    // pass matrix to u_modelmatrix attrib
    // var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
    // gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    var globalRotMat = new Matrix4().rotate(rotateanglex, 0, 1, 0).rotate(rotateangley, 1, 0, 0);
    globalRotMat.translate(-.25,.3,0);
    globalRotMat.scale(0.75, 0.75, 0.75);
    globalRotMat.rotate(g_xangle, 0, 1, 0);
    globalRotMat.rotate(g_yangle, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    renderScene();

    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + duration.toFixed(2) + " fps: " + Math.floor(10000/duration), "numdot");

}



function renderScene() {
    // Body
     var body = new Cube();
     body.color = [0.4, 0.4, 0.4, 1.0]; // Grey color
     body.matrix.setTranslate(0.9, -0.1, -.3);
     body.matrix.scale(1.1, 0.6, 0.8); // Scale it to elongated cube
     body.matrix.rotate(90, 0, 1, 0); // Rotate to face side
     body.matrix.rotate(180, 0, 1, 0); // Additional rotation to face left
     body.matrix.rotate(bodyangle, 0.3, 0, 0);
     body.render();

     // Head
     var head = new Cube();
     head.color = [0.5, 0.5, 0.5, 1.0]; // Grey color
     head.matrix.setTranslate(-0.1, 0.1, -0.2); // Adjust position to be on the left side
     head.matrix.scale(0.5, 0.5, 0.6); // Smaller cube for the head
     head.matrix.rotate(90, 0, 1, 0); // Maintain side view orientation
     head.matrix.rotate(180, 0, 1, 0); // Additional rotation to face left
     head.matrix.rotate(headAngle, 1, 0, 0);
     var headcoords = new Matrix4(head.matrix);
     var headcoords1 = new Matrix4(head.matrix);
     var headcoords2 = new Matrix4(head.matrix);
     head.render();

     // Ears
     var leftEar = new Cube();
     leftEar.color = [0.3, 0.3, 0.3, 1.0]; // Grey color
     leftEar.matrix = headcoords;
     leftEar.matrix.translate(1, 0.4, 0.6); // Adjust ear positions to the left
     leftEar.matrix.rotate(earsangle, -0.5, 1, 0); // Rotate around the z-axis for sway
     leftEar.matrix.scale(0.5, 0.5, 0.1); // Flat and wide for ears
     // leftEar.matrix.rotate(90, 0, 1, 0); // Ensure side view
     // leftEar.matrix.rotate(180, 0, 1, 0); // Additional rotation to face left
     leftEar.render();

     var rightEar = new Cube();
     rightEar.color = [0.3, 0.3, 0.3, 1.0];
     rightEar.matrix = headcoords1;
     rightEar.matrix.translate(-0.5, 0.4, 0.6);
     rightEar.matrix.rotate(earsangle, 0.5, 1, 0); // Rotate around the z-axis for sway
     rightEar.matrix.scale(0.5, 0.5, 0.1);
     // rightEar.matrix.rotate(90, 0, 1, 0);
     // rightEar.matrix.rotate(180, 0, 1, 0);
     rightEar.render();

     // Trunk
     var trunk = new Cube();
     trunk.color = [0.3, 0.3, 0.3, 1.0];
     trunk.matrix = headcoords2;
     trunk.matrix.translate(0.35, -0.5, 0.9); // Adjust trunk position to the left
     trunk.matrix.rotate(trunkangle, 1, 0, 1); // Rotate around the z-axis for sway
     trunk.matrix.scale(0.3, 1.2, 0.2);
     var trunkcoords = new Matrix4(trunk.matrix);
     trunk.render();

     //Trunk2
     var trunk2 = new Cube();
     trunk2.color = [0.3, 0.3, 0.3, 1.0];
     trunk2.matrix = trunkcoords;
     trunk2.matrix.translate(0, -0.5, 0); // Adjust trunk position to the left
     trunk2.matrix.scale(1, 0.6, 1);
     //trunk.matrix.rotate(trunkAngle, 0, 1, 0); // Rotate around the z-axis for sway
     trunk2.matrix.rotate(bottrunk, 1, 0, 0);
     trunk2.render();

     // Legs
     function createLeg(x, z) {
         var leg = new Cube();
         leg.color = [0.4, 0.4, 0.4, 1.0];
         leg.matrix.translate(x, -0.5, z);
         leg.matrix.scale(0.2, 0.5, 0.2); // Short and stout for legs
         leg.matrix.rotate(90, 0, 1, 0); // Orient legs for side view
         leg.matrix.rotate(180, 0, 1, 0); // Additional rotation to face left
         leg.render();
     }
     createLeg(0.9, 0.3);
     createLeg(0.6, -0.3);
     createLeg(0.3, 0.3);
     createLeg(0, -0.3);

     // Tail
     // var tail = new Sphere()
     // tail.color = [1.0, 0.7, 0.5, 1.0];
     // tail.matrix.translate(0.5, 0.5, 0.5);
     // tail.render();

 }