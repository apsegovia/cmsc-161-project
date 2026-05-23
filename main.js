import Mesh from "./mesh.js";

async function main() {
    //Retrieve <canvas> element
    var canvas = document.getElementById("main_canvas");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
    }
    console.log("canvas found")
    //Get the rendering context (WebGL)
    var gl = initializeWebGL(canvas, true);
    //initialize shaders program
    var vertexShader = initializeShader(gl, "vshader");
    var fragmentShader = initializeShader(gl, "fshader");
    var program = initializeProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    var aPositionPointer = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPositionPointer);
    var aNormalPointer = gl.getAttribLocation(program, "aNormal");
    gl.enableVertexAttribArray(aNormalPointer);

    var uFragColorPointer = gl.getUniformLocation(program, "uColor");
    var uModelMatrixPointer = gl.getUniformLocation(program, "uModelMatrix");
    var uViewMatrixPointer = gl.getUniformLocation(program, "uViewMatrix");
    var uProjectionMatrixPointer = gl.getUniformLocation(program, "uProjectionMatrix");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    //ENABLE DEPTH TESTING
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    var modelMatrix;
    var viewMatrix;
    var projectionMatrix;

    /**START PROJECTION MATRIX SPECIFICATION**/
    var fieldOfViewYAxis = glMatrix.toRadian(30);
    var aspectRatio = canvas.width / canvas.height;
    var nearPlane = 1;
    var farPlane = 100;

    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfViewYAxis, aspectRatio, nearPlane, farPlane);
    gl.uniformMatrix4fv(uProjectionMatrixPointer, false, new Float32Array(projectionMatrix));
    /**END PROJECTION MATRIX SPECIFICATION**/

    /**START VIEW MATRIX SPECIFICATION**/
    var lookAtPoint = [0.0, 0.0, 0.0, 1.0];              //where the camera is looking
    var eyePoint = [15.0, 15.0, 1.0, 1.0];              //where the camera is placed
    var upVector = [0.0, 1.0, 0.0, 0.0];              //orientation of the camera

    viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eyePoint, lookAtPoint, upVector);
    gl.uniformMatrix4fv(uViewMatrixPointer, false, new Float32Array(viewMatrix));
    /**END VIEW MATRIX SPECIFICATION**/

    //MODEL MATRIX
    modelMatrix = mat4.create();
    modelMatrix = mat4.identity(modelMatrix);
    gl.uniformMatrix4fv(uModelMatrixPointer, false, new Float32Array(modelMatrix));

    //add normal matrix
    var normalMatrix = mat4.create();
    var uNormalMatrixPtr = gl.getUniformLocation(program, "uNormalMatrix");
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(uNormalMatrixPtr, false, new Float32Array(normalMatrix));

    //set-up light and material parameters
    var uMaterialDiffuseColorPtr = gl.getUniformLocation(program, "uMaterialDiffuseColor");
    gl.uniform4f(uMaterialDiffuseColorPtr, 0.0, 1.0, 0.0, 1.0);

    var uLightDiffuseColorPtr = gl.getUniformLocation(program, "uLightDiffuseColor");
    gl.uniform4f(uLightDiffuseColorPtr, 1.0, 1.0, 1.0, 1.0);

    var uLightDirectionVectorPtr = gl.getUniformLocation(program, "uLightDirectionVector");
    gl.uniform4f(uLightDirectionVectorPtr, -1.0, -3.0, -5.0, 0.0);

    let meshes = {};

    await fetch("./model_references/model.json")
        .then(res => res.json())
        .then(data => {

            for (const [name, meshData] of Object.entries(data)) {

                meshes[name] = new Mesh(gl, name, meshData);

                console.log("Mesh:", name);
                console.log("Vertices:", meshData.vertices.length);
                console.log("Normals:", meshData.normals.length);
                console.log("Indices:", meshData.indices.length);
            }

        });

    // let meshData = null;

    // await fetch("./model_references/model.json")
    //     .then(res => res.json())
    //     .then(data => {

    //         meshData = data["Stage"]; // testing muna

    //         console.log("Vertices:", meshData.vertices);
    //         console.log("Normals:", meshData.normals);
    //         console.log("Indices:", meshData.indices);
    //     });


    // //buffer creation
    // var verticesBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes["Stage"].vertexBuffer);
    gl.vertexAttribPointer(aPositionPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPositionPointer);

    // //buffer creation
    // var indexBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(meshData.indices), gl.STATIC_DRAW);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // //buffer creation
    // var normalBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes["Stage"].normalBuffer);
    gl.vertexAttribPointer(aNormalPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormalPointer);

    //draw part
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

    let animation_mode = false;

    let angle = 0;
    let previousTime = 0;

    console.log(meshes)

    function render(time) {
        let deltaTime = time - previousTime; // since FPS varies, time is a good basis; i remember this being an issue in Fallout New Vegas where 60fps sped up the game from the normal 30fps because there was no delta time lol
        previousTime = time;

        // Clear screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Rotate cube
        angle += deltaTime * 0.001;

        mat4.identity(modelMatrix);
        // mat4.rotateY(modelMatrix, modelMatrix, angle);

        // Update model matrix
        gl.uniformMatrix4fv(uModelMatrixPointer, false, modelMatrix);

        // Update normal matrix
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uNormalMatrixPtr, false, normalMatrix);

        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes["Stage"].indexBuffer);
        gl.drawElements(gl.TRIANGLES, meshes["Stage"].indices.length, gl.UNSIGNED_BYTE, 0);
        if (animation_mode) {
            requestAnimationFrame(render); // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
        }
        return;
    }

    requestAnimationFrame(render);


    // document.getElementById("animationSwitch").onclick = function () {
    //     animation_mode = this.checked;
    //     document.getElementById("animationSwitchOut").innerHTML =
    //         this.checked ? "ON" : "OFF";
    //     if (animation_mode) {
    //         requestAnimationFrame(render); // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
    //     }

    // }
}

main();