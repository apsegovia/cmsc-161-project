import Mesh from "./mesh.js";
import Spotlight from "./spotlight.js";

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

    var aPositionPointer = gl.getAttribLocation(program, "aPosition"); // vertex
    gl.enableVertexAttribArray(aPositionPointer);
    var aNormalPointer = gl.getAttribLocation(program, "aNormal"); // normal
    gl.enableVertexAttribArray(aNormalPointer);
    // var aColorPointer = gl.getAttribLocation(program, "aColor"); // color
    // gl.enableVertexAttribArray(aColorPointer);
    // var aUVPointer = gl.getAttribLocation(program, "aUV"); // UV
    // gl.enableVertexAttribArray(aUVPointer);

    var uFragColorPointer = gl.getUniformLocation(program, "uColor");

    // var uUseTexturePtr = gl.getUniformLocation(program, "uUseTexture");
    // var uUseVertexColorPtr = gl.getUniformLocation(program, "uUseVertexColor");
    // var uTexturePtr = gl.getUniformLocation(program, "uTexture");

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
    var lookAtPoint = [-2.50222, 1.1956, 4.36323, 1.0]; //where the camera is looking // this is the sword lol
    var eyePoint = [0, 1, 0, 1.0];              //where the camera is placed
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
    gl.uniform4f(uLightDiffuseColorPtr, 0.2, 0.2, 0.2, 1.0); // dim global lighting so the spotlights can pop

    var uLightDirectionVectorPtr = gl.getUniformLocation(program, "uLightDirectionVector");
    gl.uniform4f(uLightDirectionVectorPtr, 0, -1, 0, 0); // changing this to global light that points down

    // spotlight pointers
    var uSpotPositionPtr = gl.getUniformLocation(program, "uSpotPosition");
    var uSpotDirectionPtr = gl.getUniformLocation(program, "uSpotDirection");
    var uSpotCutoffPtr = gl.getUniformLocation(program, "uSpotCutoff");

    // ambient light
    var uAmbientColorPtr = gl.getUniformLocation(program, "uAmbientColor");
    gl.uniform4f(uAmbientColorPtr, 0.05, 0.05, 0.05, 1.0);

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

    console.log(meshes);

    // please let me have this one whimsical function name
    function floatMysteriously(mesh, deltaTime) {

        mesh.angle += deltaTime * 0.00025;
        mesh.time += deltaTime * 0.001;

        let bob = Math.sin(mesh.time) * 0.1; // bob as in bobbing

        mat4.identity(mesh.TM);

        mat4.translate(
            mesh.TM,
            mesh.TM,
            [
                mesh.blenderPosition[0],
                mesh.blenderPosition[1] + bob,
                mesh.blenderPosition[2]
            ]
        );

        mat4.rotateY(mesh.TM, mesh.TM, mesh.angle);
    }

    // since I had to move the objects to 0,0,0 in blender 
    // so I can rotate them here in webgl around the origin
    // and then translate by these coordinates where the pedestals are
    meshes["Sword"].blenderPosition = [-2.50222, 1.1956, 4.36323];
    meshes["Shield"].blenderPosition = [5.00765, 1.07053, -0.032968];
    meshes["Staff"].blenderPosition = [-2.50796, 1.75982, -4.32916];

    meshes["Sword"].animation = floatMysteriously;
    meshes["Shield"].animation = floatMysteriously;
    meshes["Staff"].animation = floatMysteriously;

    // spotlight locations same as the weapons, just higher
    let spotlights = [];

    spotlights.push(new Spotlight([-2.50222, 4, 4.36323], [0, -1, 0], 15));
    spotlights.push(new Spotlight([5.00765, 4, -0.032968], [0, -1, 0], 15));
    spotlights.push(new Spotlight([-2.50796, 4, -4.32916], [0, -1, 0], 15));

    //
    let positions = [];
    let directions = [];
    let cutoffs = [];

    for (const light of spotlights) {
        positions.push(...light.position);
        directions.push(...light.direction);
        cutoffs.push(light.cutoff);
    }

    gl.uniform3fv(uSpotPositionPtr, positions);
    gl.uniform3fv(uSpotDirectionPtr, directions);
    gl.uniform1fv(uSpotCutoffPtr, cutoffs);

    // https://learnwebgl.brown37.net/07_cameras/camera_linear_motion.html
    // https://learnopengl.com/Getting-started/Camera
    const keys = {};

    window.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // let yaw = 0; // rotation about the camera's Y axis, in webGL 
    // // i want it facing the sword first
    let initialForward = vec3.create();
    vec3.subtract(initialForward, lookAtPoint, eyePoint);
    vec3.normalize(initialForward, initialForward);
    let yaw = Math.atan2(initialForward[0], initialForward[2]);

    let previousTime = 0;

    function render(time) {
        let deltaTime = time - previousTime;
        previousTime = time;

        // camera variables
        let speed = deltaTime * 0.001;
        let turnSpeed = deltaTime * 0.001;

        // clear screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /**
         *  update camera first when WASD QE are pressed
         */

        // rotate in place; q is left, e is right
        if (keys["q"]) yaw += turnSpeed;
        if (keys["e"]) yaw -= turnSpeed;

        // based on the yaw, adjust where the camera looks towards
        let forward = vec3.fromValues(Math.sin(yaw), 0, Math.cos(yaw));
        vec3.normalize(forward, forward);

        // by knowing where is up, we can also find the sides, this case; right
        let right = vec3.create();
        vec3.cross(right, forward, upVector);
        vec3.normalize(right, right);

        // reusable movement vector
        let move = vec3.create();

        // W - forward, S - backward, A - Strafe Left, D - Strafe Right
        vec3.scale(move, forward, speed);
        if (keys["w"]) vec3.add(eyePoint, eyePoint, move);
        if (keys["s"]) vec3.sub(eyePoint, eyePoint, move);

        vec3.scale(move, right, speed);
        if (keys["d"]) vec3.add(eyePoint, eyePoint, move);
        if (keys["a"]) vec3.sub(eyePoint, eyePoint, move);

        // update where it's looking
        vec3.add(lookAtPoint, eyePoint, forward);

        // update camera
        mat4.lookAt(viewMatrix, eyePoint, lookAtPoint, upVector);
        gl.uniformMatrix4fv(uViewMatrixPointer, false, viewMatrix);

        // update render of each object
        for (const mesh of Object.values(meshes)) {

            // for the three weapons; the stage and pedestal are null for Mesh.draw so they just remain static
            mesh.draw(deltaTime);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
            gl.vertexAttribPointer(aPositionPointer, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
            gl.vertexAttribPointer(aNormalPointer, 4, gl.FLOAT, false, 0, 0);

            // gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
            // gl.vertexAttribPointer(aUVPointer, 2, gl.FLOAT, false, 0, 0);

            // update model matrix
            gl.uniformMatrix4fv(uModelMatrixPointer, false, mesh.TM);

            // update normal matrix
            mat4.invert(normalMatrix, mesh.TM);
            mat4.transpose(normalMatrix, normalMatrix);
            gl.uniformMatrix4fv(uNormalMatrixPtr, false, normalMatrix);

            // use mesh color
            gl.uniform4fv(uMaterialDiffuseColorPtr, mesh.color);

            // draw/render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

main();