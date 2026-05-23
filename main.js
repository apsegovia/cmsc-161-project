import Mesh from "./mesh.js";

async function main() {

    /**
     *  mostly taken from the last exer for a while
     */

    //Retrieve <canvas> element
    var canvas = document.getElementById("main_canvas");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
    }

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


    /**
     *  TODO: keyboard controls to move camera
     */
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

    /**
     *  TODO if there's still time, separate spotlights per weapon
     */
    //set-up light and material parameters
    var uMaterialDiffuseColorPtr = gl.getUniformLocation(program, "uMaterialDiffuseColor");
    gl.uniform4f(uMaterialDiffuseColorPtr, 0.0, 1.0, 0.0, 1.0);

    var uLightDiffuseColorPtr = gl.getUniformLocation(program, "uLightDiffuseColor");
    gl.uniform4f(uLightDiffuseColorPtr, 1.0, 1.0, 1.0, 1.0);

    var uLightDirectionVectorPtr = gl.getUniformLocation(program, "uLightDirectionVector");
    gl.uniform4f(uLightDirectionVectorPtr, -1.0, -3.0, -5.0, 0.0);

    gl.enableVertexAttribArray(aPositionPointer);
    gl.enableVertexAttribArray(aNormalPointer);

    // fetching meshes from .json, which were converted from a .obj exported from blender
    let meshes = {};

    await fetch("./model.json")
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

    console.log(meshes)

    // please let me have this one whimsical function name
    function floatMysteriously(mesh, deltaTime) {

        mesh.angle += deltaTime * 0.001;
        mesh.time += deltaTime * 0.001;

        let bob = Math.sin(mesh.time) * 0.1; // bob as in bobbing

        mat4.identity(mesh.TM);

        // mat4.translate(
        //     mesh.TM,
        //     mesh.TM,
        //     [
        //         mesh.blenderPosition[0], 
        //         mesh.blenderPosition[1], 
        //         mesh.blenderPosition[2]
        //     ]
        // );

        

        // mat4.translate(
        //     mesh.TM,
        //     mesh.TM,
        //     [
        //         mesh.blenderPosition[0], 
        //         mesh.blenderPosition[1] + bob, 
        //         mesh.blenderPosition[2]
        //     ]
        // );

        // mat4.rotateY(mesh.TM, mesh.TM, mesh.angle);
    }


    meshes["Sword"].blenderPosition = [
        -2.50222, 1.1956, 4.36323
    ]
    meshes["Shield"].blenderPosition = [
        5.00765, 1.07053, -0.032968
    ]
    meshes["Staff"].blenderPosition = [
        -2.50796, 1.75982, -4.32916
    ]


    meshes["Sword"].animation = floatMysteriously;
    meshes["Shield"].animation = floatMysteriously;
    meshes["Staff"].animation = floatMysteriously;

    let previousTime = 0;

    function render(time) {
        let deltaTime = time - previousTime;
        previousTime = time;

        // clear screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // update render of each object
        for (const mesh of Object.values(meshes)) {

            // for the three weapons; the stage and pedestal are null for update so this does nothing for those
            mesh.draw(deltaTime);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
            gl.vertexAttribPointer(aPositionPointer, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
            gl.vertexAttribPointer(aNormalPointer, 4, gl.FLOAT, false, 0, 0);

            // update model matrix
            gl.uniformMatrix4fv(uModelMatrixPointer, false, mesh.TM);

            // update normal matrix
            mat4.invert(normalMatrix, mesh.TM);
            mat4.transpose(normalMatrix, normalMatrix);
            gl.uniformMatrix4fv(uNormalMatrixPtr, false, normalMatrix);

            // draw/render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

main();