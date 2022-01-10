/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
 //License From Noise Generation Library Used
"use strict";

var canvas;
var gl;

var numPositions  = 18;

var texSize = 100;

var flag = false;
var flagX = true;
var flagY = true;
var flagZ = true;
var redS = true;
var redP = false;
var greenS = true;
var greenP = false;
var blueS = true;
var blueP = true;
var rs = vec3(50, 10, 100);
var gs = vec3(75, 75, 100);
var bs = vec3(100, 100, 100);
var intensity = vec3(100, 160, 255);
var hx = 0.0;
var hy = 0.0;
var hz = 0.0;
var image3;
var program;
var uTime = 1.0;
var color = vec3(0.0, 0.0, 0.0);

function renderImage()
{
    image3 = new Uint8Array(4*texSize*texSize*texSize);
    for(var i=0; i<texSize; i++)
        for(var j=0; j<texSize; j++)
            for(var k=0; k<texSize; k++) {
              var x = i-texSize/2;
              var y = j-texSize/2;
              var z = k-texSize/2;
              var pos = i+texSize*j+texSize*texSize*k;
              if(x*x+y*y+z*z<0.16*texSize*texSize) 
              {
                   //Red Noise Generation Levels
                   if(redS) color.x = noise.simplex3(x/rs[0], y/rs[1], uTime/rs[2]);
                   if(redP) color.x = noise.perlin3(x,y,color.x);
                   if((redP == true) && (redS == false)) color.x = noise.perlin3(x,y,uTime/rs[2]);
                   color.x = Math.abs(color.x)*intensity[0];

                   //Green Noise Generation Levels
                   if(greenS) color.y = noise.simplex3(x/gs[0], y/gs[1], uTime/gs[2]);
                   if(greenP) color.y = noise.perlin3(x/100,y,color.y);
                   if((greenP == true) && (greenS == false)) color.y = noise.perlin3(x,y,uTime/gs[2]);
                   color.y = Math.abs(color.y)*intensity[1];

                   //Blue Noise Generation Levels
                   if(blueS) color.z = noise.simplex3(x/bs[0], y/bs[1], uTime/bs[2]);
                   if(blueP) color.z = noise.perlin3(x/100,y,color.z);
                   if((blueP == true) && (blueS == false)) color.z = noise.perlin3(x,y,uTime/bs[2]);
                   color.z = Math.abs(color.z)*intensity[2];

                   image3[4*(pos)] = color.x;
                   image3[4*(pos)+1] =  color.y;
                   image3[4*(pos)+2] =  color.z;

                 }
              // black outside sphere
                 else 
                 {
                   image3[4*(pos)] = 0 ;
                   image3[4*(pos)+1] = 0;
                   image3[4*(pos)+2] = 0;
                 }
                 image3[4*(pos)+3] = 255;
   }
}


var positionsArray = [];

// vertices for three orthogonal quads

var vertices = [
    vec4(-0.5, -0.5, hz, 1.0),
    vec4(-0.5, 0.5, hz, 1.0),
    vec4(0.5, 0.5, hz, 1.0),
    vec4(0.5, -0.5, hz, 1.0),

    vec4(-0.5, hy, -0.5, 1.0),
    vec4(-0.5, hy, 0.5, 1.0),
    vec4(0.5, hy, 0.5, 1.0),
    vec4(0.5, hy, -0.5, 1.0),

    vec4(hx, -0.5, -0.5, 1.0),
    vec4(hx, -0.5, 0.5, 1.0),
    vec4(hx, 0.5, 0.5, 1.0),
    vec4(hx, 0.5, -0.5, 1.0)
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = vec3(45.0, 45.0, 45.0);

var thetaLoc;

init();

function quad(a, b, c, d) {
     positionsArray.push(vertices[a]);
     positionsArray.push(vertices[b]);
     positionsArray.push(vertices[c]);
     positionsArray.push(vertices[a]);
     positionsArray.push(vertices[c]);
     positionsArray.push(vertices[d]);
}


function orthogonalQuads()
{
    quad(1, 0, 3, 2);
    quad(5, 4, 7, 6);
    quad(9, 8, 11, 10);

}


function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    orthogonalQuads();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);




    document.getElementById("toggleX").onclick = function(){flagX = !flagX};
    document.getElementById("toggleY").onclick = function(){flagY = !flagY};
    document.getElementById("toggleZ").onclick = function(){flagX = !flagZ};

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("xSlider").onchange = function(event) {
        hx = event.target.value;
        for(var i=8; i<12; i++) vertices[i][0] = hx;
        positionsArray = [];
        orthogonalQuads();
        gl.bufferData( gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    };
    document.getElementById("ySlider").onchange = function(event) {
        hy = event.target.value;
        for(var i=4; i<8; i++) vertices[i][1] = hy;
        positionsArray = [];
        orthogonalQuads();
        gl.bufferData( gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    };
    document.getElementById("zSlider").onchange = function(event) {
        hz = event.target.value;
        for(var i=0; i<4; i++) vertices[i][2] = hz;
        positionsArray = [];
        orthogonalQuads();
        gl.bufferData( gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    };

    document.getElementById("resolution").onchange = function(event) {texSize = event.target.value; init();}
    document.getElementById("toggleRS").onclick = function(){redS = !redS};
    document.getElementById("toggleGS").onclick = function(){greenS = !greenS};
    document.getElementById("toggleBS").onclick = function(){blueS = !blueS};
    document.getElementById("toggleRP").onclick = function(){redP = !redP};
    document.getElementById("toggleGP").onclick = function(){greenP = !greenP};
    document.getElementById("toggleBP").onclick = function(){blueP = !blueP};
    document.getElementById("rsx").onchange = function(event) {rs[0] = event.target.value;}
    document.getElementById("rsy").onchange = function(event) {rs[1] = event.target.value;}
    document.getElementById("rst").onchange = function(event) {rs[2] = event.target.value;}
    document.getElementById("gsx").onchange = function(event) {gs[0] = event.target.value;}
    document.getElementById("gsy").onchange = function(event) {gs[1] = event.target.value;}
    document.getElementById("gst").onchange = function(event) {gs[2] = event.target.value;}
    document.getElementById("bsx").onchange = function(event) {bs[0] = event.target.value;}
    document.getElementById("bsy").onchange = function(event) {bs[1] = event.target.value;}
    document.getElementById("bst").onchange = function(event) {bs[2] = event.target.value;}
    document.getElementById("ri").onchange = function(event) {intensity[0] = event.target.value;}
    document.getElementById("gi").onchange = function(event) {intensity[1] = event.target.value;}
    document.getElementById("bi").onchange = function(event) {intensity[2] = event.target.value;}


    renderImage();
    var texture3D = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture3D);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, texSize, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image3);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_3D);
    gl.uniform1i( gl.getUniformLocation(program, "uTextureMap3D"), 0);
    thetaLoc = gl.getUniformLocation(program, "uTheta");

    render();
}

function render() 
{
    uTime += 1.0;
    //Render Image
    renderImage();

    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, texSize, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image3);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);
    if(flagX) gl.drawArrays( gl.TRIANGLES, 0, numPositions/3 );
    if(flagY) gl.drawArrays( gl.TRIANGLES, numPositions/3, numPositions/3 );
    if(flagZ) gl.drawArrays( gl.TRIANGLES, 2*numPositions/3, numPositions/3 );
    requestAnimationFrame(render);
}

