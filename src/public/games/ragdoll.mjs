import { DeviceInfo } from '../utils.mjs';
let Ammo = new AmmoLib();
console.log(Ammo);
let debug = true;
let deviceInfo = DeviceInfo();

export default class Ragdoll {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physicsWorld = null;
        this.rigidBodies = [];
        this.tmpTrans = null;
        this.clock = new THREE.Clock();
        this.ready = false;
        this.players = null;
    }
    playersReady() {
        if (!this.players) return false;
        for (let id in this.players) {
            if (!players[id].ready) return false;
        }
        return true;
    }
    setupPhysicsWorld() {
        this.tmpTrans = new Ammo.btTransform();
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    }
    createBlock() {
        let pos = { x: 0, y: -30, z: 0 };
        let scale = { x: 100, y: 2, z: 10 };
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;

        //threeJS Section
        let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.9 }));

        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);
        blockPlane.rotation.set(quat.x, quat.y, quat.z);
        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;

        this.scene.add(blockPlane);


        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.setFriction(4);
        body.setRollingFriction(10);

        this.physicsWorld.addRigidBody(body);
    }
    setupScene() {
        this.scene = new THREE.Scene();
        if (debug) console.log("Scene: ", this.scene);
    }
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, precision: 'mediump' });
        this.renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.sortObjects = true;
        this.renderer.domElement.setAttribute('id', 'stageElement');
        document.body.appendChild(this.renderer.domElement);
        if (debug) console.log("Renderer: ", this.renderer);
    }
    setupCamera() {
        // setup camera 
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 5000);
        this.camera.position.set(0, 30, 70);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        if (debug) console.log("Camera: ", this.camera);
    }
    setupLightSource() {
        //Add hemisphere light
        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
        hemiLight.color.setHSL(0.6, 0.6, 0.6);
        hemiLight.groundColor.setHSL(0.1, 1, 0.4);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        //Add directional light
        let dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(-1, 1.75, 1);
        dirLight.position.multiplyScalar(100);
        this.scene.add(dirLight);

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        let d = 50;

        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;

        dirLight.shadow.camera.far = 13500;
    }
    createBall() {

        let pos = { x: 0, y: 30, z: 0 };
        let radius = 2;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 1;

        //threeJS Section
        let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({ color: 0xff0505 }));

        ball.position.set(pos.x, pos.y, pos.z);

        ball.castShadow = true;
        ball.receiveShadow = true;

        this.scene.add(ball);


        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.setFriction(4);
        body.setRollingFriction(10);

        this.physicsWorld.addRigidBody(body);

        ball.userData.physicsBody = body;
        this.rigidBodies.push(ball);
    }
    updatePhysics(deltaTime) {

        // Step world
        this.physicsWorld.stepSimulation(deltaTime, 10);

        // Update rigid bodies
        for (let i = 0; i < this.rigidBodies.length; i++) {
            let objThree = this.rigidBodies[i];
            let objAmmo = objThree.userData.physicsBody;
            let ms = objAmmo.getMotionState();
            if (ms) {

                ms.getWorldTransform(this.tmpTrans);
                let p = this.tmpTrans.getOrigin();
                let q = this.tmpTrans.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

            }
        }

    }
    updateBall() {
        // Update rigid bodies
        for (let i = 0; i < this.rigidBodies.length; i++) {
            let objThree = this.rigidBodies[i];
            let resultantImpulse = new Ammo.btVector3(10, 0, 0);
            let objAmmo = objThree.userData.physicsBody;
            let physicsBody = objThree.userData.physicsBody;
            let ms = objAmmo.getMotionState();
            if (ms) {
                physicsBody.setLinearVelocity(resultantImpulse);
            }
            // resultantImpulse.op_mul(scalingFactor);

        }
    }
    setup() {
        if (debug) console.log("Setting up Ragdoll"); // setup renderer 
        // setup scene

        this.setupScene();
        this.setupRenderer();
        this.setupCamera();
        this.setupLightSource();
        this.setupPhysicsWorld();
        this.createBlock();
        this.createBall();

        // on page resize
        window.addEventListener('resize', e => {
            this.camera.aspect = deviceInfo.screenRatio();
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
        });
    }
    play() {
        let deltaTime = this.clock.getDelta();
        // this.updateBall();
        this.updatePhysics(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}