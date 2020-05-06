import { DeviceInfo, onWindowResize, LoaderHelper } from '../utils/utils.mjs';
import { OrbitControls } from "../threejs/OrbitControls.js";


let Ammo = new AmmoLib();
let debug = true;
let mouseCoords = new THREE.Vector2();
let clickRequest = false;
let deviceInfo = DeviceInfo();
let loaderHelper = new LoaderHelper('src/public/assets');

/**
 *
 *
 * @export
 * @class Ragdoll
 */
export default class Ragdoll {
    constructor() {
        // Graphics variables
        this.camera = null;
        this.controls = null;
        this.scene = null;
        this.renderer = null;
        this.textureLoader = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
        this.pos = new THREE.Vector3();
        this.quat = new THREE.Quaternion();

        // Physics variables
        this.gravityConstant = -9.8;
        this.collisionConfiguration = null;
        this.dispatcher = null;
        this.broadphase = null;
        this.solver = null;
        this.physicsWorld = null;
        this.rigidBodies = [];
        this.softBodies = [];
        this.margin = 0.05;
        this.hinge = null;
        this.transformAux1 = new Ammo.btTransform();
        this.softBodyHelpers = new Ammo.btSoftBodyHelpers();

        this.armMovement = 0;

        this.players = null;
        this.state = null;
    }
    playersReady() {
        if (!this.players) return false;
        for (let id in this.players) {
            if (!this.players[id].ready) return false;
        }
        return true;
    }
    addPlayer(player) {
        if (!this.players) this.players = {};
        this.players[player.id] = player;
    }
    removePlayer(id){
        delete this.players[id];
    }
    processGeometry(bufGeometry) {
        // Obtain a Geometry
        var geometry = new THREE.Geometry().fromBufferGeometry(bufGeometry);
        // Merge the vertices so the triangle soup is converted to indexed triangles
        var vertsDiff = geometry.mergeVertices();
        // Convert again to BufferGeometry, indexed
        var indexedBufferGeom = this.createIndexedBufferGeometryFromGeometry(geometry);
        // Create index arrays mapping the indexed vertices to bufGeometry vertices
        this.mapIndices(bufGeometry, indexedBufferGeom);

    }
    createIndexedBufferGeometryFromGeometry(geometry) {

        var numVertices = geometry.vertices.length;
        var numFaces = geometry.faces.length;

        var bufferGeom = new THREE.BufferGeometry();
        var vertices = new Float32Array(numVertices * 3);
        var indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

        for (var i = 0; i < numVertices; i++) {

            var p = geometry.vertices[i];

            var i3 = i * 3;

            vertices[i3] = p.x;
            vertices[i3 + 1] = p.y;
            vertices[i3 + 2] = p.z;

        }

        for (var i = 0; i < numFaces; i++) {

            var f = geometry.faces[i];

            var i3 = i * 3;

            indices[i3] = f.a;
            indices[i3 + 1] = f.b;
            indices[i3 + 2] = f.c;

        }

        bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));
        bufferGeom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

        return bufferGeom;
    }

    isEqual(x1, y1, z1, x2, y2, z2) {
        var delta = 0.000001;
        return Math.abs(x2 - x1) < delta &&
            Math.abs(y2 - y1) < delta &&
            Math.abs(z2 - z1) < delta;
    }

    mapIndices(bufGeometry, indexedBufferGeom) {

        // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

        var vertices = bufGeometry.attributes.position.array;
        var idxVertices = indexedBufferGeom.attributes.position.array;
        var indices = indexedBufferGeom.index.array;

        var numIdxVertices = idxVertices.length / 3;
        var numVertices = vertices.length / 3;

        bufGeometry.ammoVertices = idxVertices;
        bufGeometry.ammoIndices = indices;
        bufGeometry.ammoIndexAssociation = [];

        for (var i = 0; i < numIdxVertices; i++) {

            var association = [];
            bufGeometry.ammoIndexAssociation.push(association);

            var i3 = i * 3;

            for (var j = 0; j < numVertices; j++) {
                var j3 = j * 3;
                if (this.isEqual(idxVertices[i3], idxVertices[i3 + 1], idxVertices[i3 + 2],
                    vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {
                    association.push(j3);
                }
            }

        }

    }

    createSoftVolume(bufferGeom, mass, pressure, _material) {

        this.processGeometry(bufferGeom);
        let material = _material || new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        var volume = new THREE.Mesh(bufferGeom, material);
        volume.castShadow = true;
        volume.receiveShadow = true;
        volume.frustumCulled = false;
        this.scene.add(volume);

        this.textureLoader.load("src/public/assets/crazy-chicken-no-alpha.png", function (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 1);
            volume.material.map = texture;
            volume.material.needsUpdate = true;
        });

        // Volume physic object

        var volumeSoftBody = this.softBodyHelpers.CreateFromTriMesh(
            this.physicsWorld.getWorldInfo(),
            bufferGeom.ammoVertices,
            bufferGeom.ammoIndices,
            bufferGeom.ammoIndices.length / 3,
            true);

        var sbConfig = volumeSoftBody.get_m_cfg();
        sbConfig.set_viterations(40);
        sbConfig.set_piterations(40);

        // Soft-soft and soft-rigid collisions
        sbConfig.set_collisions(0x11);

        // Friction
        sbConfig.set_kDF(0.1);
        // Damping
        sbConfig.set_kDP(0.01);
        // Pressure
        sbConfig.set_kPR(pressure);
        // Stiffness
        volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
        volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9);

        volumeSoftBody.setTotalMass(mass, false)
        Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin);
        this.physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
        volume.userData.physicsBody = volumeSoftBody;
        // Disable deactivation
        volumeSoftBody.setActivationState(4);

        this.softBodies.push(volume);

    }

    createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

        var threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
        var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
        shape.setMargin(this.margin);

        this.createRigidBody(threeObject, shape, mass, pos, quat);

        return threeObject;

    }

    createRigidBody(threeObject, physicsShape, mass, pos, quat) {

        threeObject.position.copy(pos);
        threeObject.quaternion.copy(quat);

        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        var motionState = new Ammo.btDefaultMotionState(transform);

        var localInertia = new Ammo.btVector3(0, 0, 0);
        physicsShape.calculateLocalInertia(mass, localInertia);

        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        threeObject.userData.physicsBody = body;

        this.scene.add(threeObject);

        if (mass > 0) {
            this.rigidBodies.push(threeObject);

            // Disable deactivation
            body.setActivationState(4);
        }

        this.physicsWorld.addRigidBody(body);

        return body;
    }
    createPlayer(color) {
        let material = new THREE.MeshPhongMaterial({ color: color })
        let volumeMass = 0.1;
        let sphereGeometry = new THREE.SphereBufferGeometry(1.5, 40, 25);
        sphereGeometry.translate(-width / 4, height + 10, -8);
        this.createSoftVolume(sphereGeometry, volumeMass, 100, material);
    }
    createObjects() {
        let pos = new THREE.Vector3();
        let quat = new THREE.Quaternion();
        let width = 80;
        let height = 80;

        // Ground
        pos.set(0, - 0.5, 0);
        quat.set(0, 0, 0, 1);
        var ground = this.createParalellepiped(width, 1, height, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0xFFFFFF }));
        ground.castShadow = true;
        ground.receiveShadow = true;
        this.textureLoader.load("src/public/assets/ground.jpg", function (texture) {
            ground.material.map = texture;
            ground.material.needsUpdate = true;
        });



        var volumeMass = 0.1;
        var sphereGeometry = new THREE.SphereBufferGeometry(1.5, 40, 25);
        sphereGeometry.translate(width / 4, height + 10, -8);
        this.createSoftVolume(sphereGeometry, volumeMass, 100);

        // Rods
        var rod;
        for (let i = 0; i < width; i += 5) {
            for (let j = height - 5; j >= 10; j -= 5) {
                let x = j % 2 === 0 ? -width / 2 : -width / 2 + 2.5;
                pos.set(i + x, j, 0);
                rod = this.createParalellepiped(0.5, 0.5, 25, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
                rod.castShadow = true;
                rod.receiveShadow = true;
            }
        }

        // Platforms
        let numObjects = 8;
        let tWidth = width / numObjects;
        for (let i = 0; i < numObjects; i++) {
            pos.set(i * tWidth - width / 2 + tWidth / 2, 0, 0);
            var trigger = this.createParalellepiped(tWidth - 1, 0, 30, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0x0000ff }));
            trigger.castShadow = true;
            trigger.receiveShadow = true;
        }

        // Wall
        pos.set(0, height / 2, -10);
        var obstacle = this.createParalellepiped(width, height, 1, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0xffffff }));
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;

    }
    initInput() {
        window.addEventListener('mousedown', function (event) {
            if (!clickRequest) {
                mouseCoords.set(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    - (event.clientY / window.innerHeight) * 2 + 1
                );
                clickRequest = true;
            }

        }, false);
    }
    processClickRequest(user, coords) {
        let pos = new THREE.Vector3();
        let quat = new THREE.Quaternion();

        this.raycaster.setFromCamera(coords, this.camera);

        // Creates a ball
        var ballMass = 2;
        var ballRadius = 1;

        var ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 18, 16), new THREE.MeshPhongMaterial({ color: user.character }));
        ball.castShadow = true;
        ball.receiveShadow = true;
        var ballShape = new Ammo.btSphereShape(ballRadius);
        ballShape.setMargin(this.margin);
        pos.copy(this.raycaster.ray.direction);
        pos.add(this.raycaster.ray.origin);
        quat.set(0, 0, 0, 1);
        var ballBody = this.createRigidBody(ball, ballShape, ballMass, pos, quat);
        ballBody.setFriction(1);

        pos.copy(this.raycaster.ray.direction);
        pos.multiplyScalar(150);
        ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));

        clickRequest = false;

    }
    processClick() {
        let pos = new THREE.Vector3();
        let quat = new THREE.Quaternion();

        if (clickRequest) {

            this.raycaster.setFromCamera(mouseCoords, this.camera);

            // Creates a ball
            var ballMass = 2;
            var ballRadius = 1;

            var ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 18, 16), this.ballMaterial);
            ball.castShadow = true;
            ball.receiveShadow = true;
            var ballShape = new Ammo.btSphereShape(ballRadius);
            ballShape.setMargin(this.margin);
            pos.copy(this.raycaster.ray.direction);
            pos.add(this.raycaster.ray.origin);
            quat.set(0, 0, 0, 1);
            var ballBody = this.createRigidBody(ball, ballShape, ballMass, pos, quat);
            ballBody.setFriction(1);

            pos.copy(this.raycaster.ray.direction);
            pos.multiplyScalar(150);
            ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));

            clickRequest = false;

        }

    }
    initPhysics() {

        // Physics configuration
        this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration, this.softBodySolver);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
        this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, this.gravityConstant, 0));

    }
    initGraphics() {

        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(60, deviceInfo.screenWidth() / deviceInfo.screenHeight(), 0.9, 2000);
        this.camera.position.x = 8;
        this.camera.position.y = 50;
        this.camera.position.z = 120;
        // Setup Scene
        this.scene = new THREE.Scene();
        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, precision: 'mediump' });
        this.renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.sortObjects = true;
        this.renderer.domElement.setAttribute('id', 'stageElement');
        document.body.appendChild(this.renderer.domElement);
        if (debug) console.log("Renderer: ", this.renderer);
        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.y = 30;
        // Setup texture loader
        this.textureLoader = new THREE.TextureLoader();
        // Setup Light
        var ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);
        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(40, 40, 20);
        light.castShadow = true;
        var d = 20;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.camera.near = 2;
        light.shadow.camera.far = 50;
        light.shadow.mapSize.x = 1024;
        light.shadow.mapSize.y = 1024;
        this.scene.add(light);
        // Setup window resize event
        window.addEventListener('resize', onWindowResize, false);

    }

    animate() {

        var deltaTime = this.clock.getDelta();

        if (this.playersReady()) {
            this.updatePhysics(deltaTime);
            this.processClick();
        }

        this.controls.update(deltaTime);

        this.renderer.render(this.scene, this.camera);

    }

    updatePhysics(deltaTime) {

        // Step world
        this.physicsWorld.stepSimulation(deltaTime, 10);

        // Update soft volumes
        for (var i = 0, il = this.softBodies.length; i < il; i++) {
            var volume = this.softBodies[i];
            var geometry = volume.geometry;
            var softBody = volume.userData.physicsBody;
            var volumePositions = geometry.attributes.position.array;
            var volumeNormals = geometry.attributes.normal.array;
            var association = geometry.ammoIndexAssociation;
            var numVerts = association.length;
            var nodes = softBody.get_m_nodes();
            for (var j = 0; j < numVerts; j++) {

                var node = nodes.at(j);
                var nodePos = node.get_m_x();
                var x = nodePos.x();
                var y = nodePos.y();
                var z = nodePos.z();
                var nodeNormal = node.get_m_n();
                var nx = nodeNormal.x();
                var ny = nodeNormal.y();
                var nz = nodeNormal.z();

                var assocVertex = association[j];

                for (var k = 0, kl = assocVertex.length; k < kl; k++) {
                    var indexVertex = assocVertex[k];
                    volumePositions[indexVertex] = x;
                    volumeNormals[indexVertex] = nx;
                    indexVertex++;
                    volumePositions[indexVertex] = y;
                    volumeNormals[indexVertex] = ny;
                    indexVertex++;
                    volumePositions[indexVertex] = z;
                    volumeNormals[indexVertex] = nz;
                }
            }

            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;

        }

        // Update rigid bodies
        for (var i = 0, il = this.rigidBodies.length; i < il; i++) {
            var objThree = this.rigidBodies[i];
            var objPhys = objThree.userData.physicsBody;
            var ms = objPhys.getMotionState();
            if (ms) {

                ms.getWorldTransform(this.transformAux1);
                var p = this.transformAux1.getOrigin();
                var q = this.transformAux1.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

            }
        }

    }
    setup() {

        if (debug) console.log("Setting up Ragdoll");

        let deltaTime = this.clock.getDelta();

        this.initGraphics();
        this.initPhysics();
        this.createObjects();
        this.initInput();
        this.controls.update(deltaTime);
        this.renderer.render(this.scene, this.camera);

    }

    update(state) {
        this.players = state;
    }

    play() {

        this.animate();

    }
}