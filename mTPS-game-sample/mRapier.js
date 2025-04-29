import { GUI } from '/mTPS-game-sample/lib/lil-gui.module.min.js';
import RAPIER from '@dimforge/rapier3d-compat'

await RAPIER.init();
console.log("RAPIER:");

/*const btn = document.getElementById("start");
btn.addEventListener("click", mbuttonAction, false);
function mbuttonAction(){
    console.log("mbuttonAction")
    init()
}*/


init();

//window.addEventListener('DOMContentLoaded', init);
function init() {

    let mArrayAudio = [];

    function loadAudio(url) {
        return fetch(url,{mode: 'cors'})
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
              //mode: 'cors'
              //credentials: 'omit'
            return new Promise((resolve, reject) => {
              audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
                resolve(audioBuffer);
              }, (err) => {
                reject(err);
              });
            });
          });
      }
      
    function loadAudios() {
        let promises = [
            loadAudio('/mTPS-game-sample/sound/bullet-hit-001.mp3'),
            loadAudio('/mTPS-game-sample/sound/handgun.mp3'),
            loadAudio('/mTPS-game-sample/sound/build-destory.mp3'),
        ];
        Promise.all(promises).then(audioBuffers => {
            
            for(var i=0;i<audioBuffers.length;i++){
                mArrayAudio[i] = audioBuffers[i];
            }
            console.log("sound loaded")
        });    
    
    }
    loadAudios()

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    function mPlayAudioBuffer(audioBuffer, volume = 1.0) {
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        //console.log("volume:"+volume);

        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioContext.destination);
        audioSource.connect(gainNode);
        audioSource.start();
    }


    
    let width = window.innerWidth;
    let height = window.innerHeight;
    const canvas2d = document.querySelector( '#canvas-2d' );

    
    let g_scale = 20.0
    const gravity = new RAPIER.Vector3(0.0, -9.81*g_scale, 0.0)
    const world = new RAPIER.World(gravity)
    
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const canvas3d = document.querySelector( '#canvas' );
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas3d, //document.querySelector('#canvas')
        antialias: true
    });
    //const main_canvas = document.querySelector( '#main_canvas' );
    //let width = document.getElementById('main_canvas').getBoundingClientRect().width;
    //let height = document.getElementById('main_canvas').getBoundingClientRect().height;
    
    renderer.setPixelRatio(window.devicePixelRatio);
    //renderer.setClearColor(new THREE.Color('darkblue')); //'gray'
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    console.log(window.devicePixelRatio);
    console.log(width+", "+height);

    let resolution;
    resolution = new THREE.Vector2();
    renderer.getSize(resolution);
 
    const scene = new THREE.Scene();

    let mScale = 1;
    let grid_size = mScale*5;
    let gridH_size = mScale*4;
    let buildThick = mScale*0.1;
    let grid_num = 10;

 
    let camera = new THREE.PerspectiveCamera(80, width / height, mScale*0.01, mScale * 100);
    let mCameraOffset = new Object();
    mCameraOffset.dx = mScale*0.5;
    mCameraOffset.dy = mScale*0.6; //1.4
    mCameraOffset.dz = mScale*1.6; //1000*1.6;
    
    function mSetCameraPosition(camera, offset, player){

        if(!player.playerMesh){
            return
        }

        let p = player.playerMesh.position //model.position;
        let dx = offset.dx; // 1000*0.1;
        let dy = offset.dy; //1000*1.4;
        let dz = offset.dz; //1000*1.6;
        if(c_player.isCrouch || c_player.isSliding){
            dy *= 0.5
        }
        //camera.position.set(p.x + dx, p.y + dy, p.z + dz);
        //camera.lookAt(new THREE.Vector3(p.x + dx, p.y + dy, p.z));

        if(player){    
            let a1 = player.angle;
            let a2 = -player.angle2;
            camera.position.set(
                p.x + ( Math.sin(a1) * Math.cos(a2) * dz + Math.cos(a1) * dx ), 
                p.y + dy + dz * Math.sin(a2), 
                p.z + ( Math.cos(a1) * Math.cos(a2) * dz - Math.sin(a1) * dx )
            );
            
            camera.rotation.order = "YXZ";
            camera.rotation.y =  a1;// - Math.PI/2;
            camera.rotation.x = -a2;

            /*if(player.weaponMesh){
                let dx = mWeaponOffset.dx; // 1000*0.1;
                let dy = mWeaponOffset.dy; //1000*1.4;
                let dz = mWeaponOffset.dz; 
                let ddy = 0.1;
                player.weaponMesh.position.set(
                    dx, 
                    dy *(1-ddy) + dz * Math.sin(-a2) + dy*ddy*Math.cos(-a2), 
                    Math.cos(-a2) * dz + dy*ddy*Math.sin(-a2)
                );
                player.weaponMesh.rotation.x = a2;

            }*/
        }

        // weapon
        playerPiv1.position.y = dy;
    }

    //--- Light ---//
    let light_pos0 = new THREE.Vector3();
    light_pos0.x = 0;
    light_pos0.y = gridH_size* grid_num;
    light_pos0.z = grid_size*3;
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(light_pos0.x, light_pos0.y, light_pos0.z);
    light.intensity = 1; 
    light.castShadow = true; //false; //
    console.log("light.shadow.camera:%o", light.shadow.camera);
    let s_ = grid_size * grid_num *0.3;
    light.shadow.camera.top *= s_;
    light.shadow.camera.bottom *= s_;
    light.shadow.camera.left *= s_;
    light.shadow.camera.right *= s_;
    light.shadow.mapSize.width = 1024 * 8
    light.shadow.mapSize.height = 1024 * 8
    //light.shadow.camera.near = gridH_size*grid_num
    light.shadow.camera.far = gridH_size*grid_num*1.3;
    scene.add(light);
    //const light = new THREE.SpotLight(0xffffff, 400, 100, Math.PI / 4, 1);
    //light.castShadow = true;
    //scene.add(light);

    const light2 = new THREE.DirectionalLight(0xFFFFFF);
    light2.position.set(grid_size*3, gridH_size* grid_num, -grid_size*3);
    light2.intensity = 1; 
    scene.add(light2);

    /*const light3 = new THREE.DirectionalLight(0xFFFFFF);
    light2.position.set(grid_size*3, gridH_size* grid_num, 0);
    light2.intensity = 0.1; 
    scene.add(light2);*/


    //--- Environment ---//
    new THREE.RGBELoader()
        .setPath( 'image/' )
        .load( 'quarry_01_1k.hdr', function ( texture ) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
        } );


    //--- Character model ---//
    //const url = '/mTPS-game-sample/model/no0.glb';
    
    let playerMesh = new THREE.Group();
    let playerRadius = 0.35 * mScale;
    //playerMesh.castShadow = true;
    //playerMesh.receiveShadow = true;
    let playerPiv1 = new THREE.Group();

    //let model = null;
    //let mAxes = null;
    
    let mixer;
    let props, lastAnimID;
    let arrayAction = new Array(30); //[];
    let mAnimOrder = {Idle:0, RunForward:1, RunBack:2, RunLeft:3, RunRight:4, 
                    Jump:5, 
                    CrouchIdle:6, CrouchForward:7, CrouchBack:8,  CrouchLeft:9,  CrouchRight:10,  
                    Slide:11,
                    ShootIdle:12, ShootStand: 13, ShootCrouch:14 };
    let model_scale = mScale*0.01;  // 10;
    const loader = new THREE.FBXLoader();
    loader.load( 'model/mSet14.fbx', function ( object ) {

        console.log("object:%o", object);
        //object.children[1].visible = false;

        mixer = new THREE.AnimationMixer( object );
        console.log("object.animations.length:"+object.animations.length)
        for(var i = 0; i<object.animations.length; i++){
            console.log("%o", object.animations[ i ]);
            //arrayAction.push( mixer.clipAction(object.animations[ i ]) );
            if(object.animations[i].name=="Slide"){
                object.animations[i] = THREE.AnimationUtils.subclip(object.animations[i], 'Slide', 1, 27);
            }
            arrayAction[ mAnimOrder[object.animations[i].name] ] = mixer.clipAction(object.animations[ i ]);
        }
        arrayAction[0].play();
        //arrayAction[6].play();

        arrayAction[5].setLoop(THREE.LoopOnce);
        arrayAction[5].clampWhenFinished = true;

        //--- Slide
        arrayAction[11].setLoop(THREE.LoopOnce);
        arrayAction[11].clampWhenFinished = true;

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        c_player.model = object;
        c_player.playerMesh = playerMesh;

        object.scale.set(model_scale, model_scale, model_scale);
        object.position.set(0, -playerRadius*2.5, 0);
        playerMesh.add(object);
        scene.add( playerMesh );

        playerPiv1.position.set(-mCameraOffset.dx, mCameraOffset.dy, 0);
        playerMesh.add(playerPiv1);
        
        const size = mScale*0.2;
        let ax = new THREE.AxesHelper(size);
        ax.visible = false;
        playerPiv1.add(ax);
        
        mSetCameraPosition(camera, mCameraOffset, c_player); //playerMesh
    } );

    let weaponMesh = new THREE.Group();
    let mWeaponOffset = new Object();
    mWeaponOffset.dx = -mCameraOffset.dx; //mScale*-0.2;
    mWeaponOffset.dy = mCameraOffset.dy *0.73; //mScale*0.5; //1.4
    mWeaponOffset.dz = -mCameraOffset.dz*0.9; //mScale*0.5; //1000*1.6;
    let muzzlePos = new THREE.Object3D();

    loader.load( 'model/Scar_L01.fbx', function ( object ) {

        console.log("object:%o", object);

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        object.scale.set(0.002, 0.002, 0.002);
        //object.position.set(-0.2, 0.5, 0.5);

        weaponMesh.add(object)
        weaponMesh.visible = false;
        c_player.weaponMesh = weaponMesh;
        /*weaponMesh.position.set(mWeaponOffset.dx, mWeaponOffset.dy, mWeaponOffset.dz);
        playerMesh.add(weaponMesh);*/

        weaponMesh.position.set(0, -0.16, mWeaponOffset.dz);
        playerPiv1.add(weaponMesh);

        muzzlePos.position.set(0, -0.16, mWeaponOffset.dz*0.6);
        playerPiv1.add(muzzlePos);
        
    } );

    /*const loaderW = new THREE.GLTFLoader();
    const url = '/mTPS-game-sample/model/no0.glb';
    loaderW.load(
        url, 
        function ( gltf ){
            model = gltf.scene;
            model.name = "model_with_cloth";
            model.scale.set(model_scale, model_scale, model_scale);
            model.position.set(0, 0, 0);
            playerMesh.add(model);

        },
        function ( error ) {
            console.log( 'An error happened' );
            //console.log( error );
        }
    );*/


    //--- Global Axis ---//
    const size = grid_size*0.1;
    let gAxes = new THREE.AxesHelper(size);
    gAxes.position.x =  0;
    gAxes.position.y = mScale*0.1; 
    scene.add(gAxes);
    
    //--- Grid ---//
    const grid = new THREE.GridHelper( grid_size*grid_num*2, grid_num*2, 0x000000, 0x000000 );
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    scene.add( grid );

    //--- ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( grid_size*grid_num*2, grid_size*grid_num*2 ), new THREE.MeshPhongMaterial( { color: '#333' } ) );//, depthWrite: false
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );
        const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0))
        const floorShape = RAPIER.ColliderDesc.cuboid(grid_size*grid_num, 0.5, grid_size*grid_num)
        world.createCollider(floorShape, floorBody)

    let ArrayMesh = [];
    let ArrayBody = [];
    let mMaterial = new THREE.MeshLambertMaterial({color: 0x6699FF});
    mMaterial.transparent = true;
    mMaterial.opacity = 1.0;

    //--- Cube
    const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mMaterial)
    cubeMesh.castShadow = true
    scene.add(cubeMesh)
        const cubeBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(grid_size*0, 1, -grid_size))
        const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape, cubeBody)
    ArrayMesh.push(cubeMesh);
    ArrayBody.push(cubeBody);

    const cubeMesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mMaterial)
    cubeMesh1.castShadow = true
    scene.add(cubeMesh1)
        const cubeBody1 = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(grid_size*1, 0.5, -grid_size))
        const cubeShape1 = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape1, cubeBody1)
    ArrayMesh.push(cubeMesh1);
    ArrayBody.push(cubeBody1);

    const cubeMesh2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mMaterial)
    cubeMesh2.castShadow = true
    scene.add(cubeMesh2)
        const cubeBody2 = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(grid_size*2, 2.5, -grid_size))
        const cubeShape2 = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape2, cubeBody2)
    ArrayMesh.push(cubeMesh2);
    ArrayBody.push(cubeBody2);

    let ArrayBuild = [];
    let build_id = 0;

    function mCreateWall(px, py, pz, type="z"){
        let Lx = grid_size;
        let Ly = gridH_size;
        let Lz = buildThick;
        if(type == "x"){
            Lz = grid_size;
            Lx = buildThick;
        }
    
        let mat = new THREE.MeshLambertMaterial({color: 0x6699FF});
        mat.transparent = true;
        mat.opacity = 1.0;
    
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(Lx, Ly, Lz), mat)
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh)
            const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz))
            const wallShape = RAPIER.ColliderDesc.cuboid(Lx/2, Ly/2, Lz/2).setMass(1).setRestitution(0.0).setFriction(0.0)
            let col = world.createCollider(wallShape, wallBody)
            col.build_id = build_id;
            //console.log("col:%o", col);
        ArrayMesh.push(wallMesh);
        ArrayBody.push(wallBody);
        
        mAddBuild(col, wallMesh, wallBody)
        build_id += 1; 
    }

    function mAddBuild(col, mesh, body){
        let b = new Object();
        b.build_id = build_id;
        b.collider = col;
        b.buildMesh = mesh;
        b.body = body;
        b.maxHealth = 150;
        b.health = 150;
        //ArrayBuild[col.handle] = b;
        ArrayBuild[build_id] = b;
    }

    mCreateWall(-grid_size*2+grid_size/2, gridH_size/2, -grid_size*2)
    mCreateWall(-grid_size*3+grid_size/2, gridH_size/2, -grid_size*2)
    for(var i=0; i<grid_num; i++){
        mCreateWall(grid_size*(-i), gridH_size/2, grid_size*1+grid_size/2, "x")
    }
    for(var i=-grid_num; i<grid_num; i++){
        mCreateWall(grid_size*i+grid_size/2, gridH_size/2, -grid_size*grid_num)
    }
    

    //console.log("ArrayBuild:%o", ArrayBuild);

    function mCreateSlope(px, py, pz, type="z-"){
        console.log("mCreateSlope:"+type)
        let L = Math.sqrt(grid_size*grid_size+gridH_size*gridH_size)
            //console.log("L:"+L)
        let Lx = grid_size
        let Ly = buildThick
        let Lz = L

        let mat = new THREE.MeshLambertMaterial({color: 0x6699FF});
        mat.transparent = true;
        mat.opacity = 1.0;

        const slopeMesh = new THREE.Mesh(new THREE.BoxGeometry(Lx, Ly, Lz), mat)
        slopeMesh.castShadow = true
        slopeMesh.receiveShadow = true;
        scene.add(slopeMesh)
            let a = Math.acos(grid_size/L)
            if(type==="z+"){
                a = -a;
            }
            let w = Math.cos(a/2)
            let x = 1.0*Math.sin(a/2)
            let y = 0.0
            let z = 0.0
            
            const slopeBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz).setRotation({ w: w, x: x, y: y, z: z }))
            const slopeShape = RAPIER.ColliderDesc.cuboid(grid_size/2, buildThick/2, L/2).setMass(1).setRestitution(0.0).setFriction(0.0)
            const slopeCollider = world.createCollider(slopeShape, slopeBody)
            slopeCollider.build_id = build_id;
        ArrayMesh.push(slopeMesh);
        ArrayBody.push(slopeBody);

        //console.log("slopeCollider.handle:", slopeCollider.handle)

        mAddBuild(slopeCollider, slopeMesh, slopeBody)
        build_id += 1; 
    }

    mCreateSlope(-grid_size*5+grid_size/2, gridH_size/2, -grid_size*1+grid_size/2, "z+")

    mCreateSlope(-grid_size*4+grid_size/2, gridH_size/2, -grid_size*2+grid_size/2)
    mCreateSlope(-grid_size*4+grid_size/2, gridH_size*1+gridH_size/2, -grid_size*3+grid_size/2)
    mCreateSlope(-grid_size*4+grid_size/2, gridH_size*2+gridH_size/2, -grid_size*4+grid_size/2)

    function mCreateFloor(px, py, pz){    
        let mat = new THREE.MeshLambertMaterial({color: 0x6699FF});
        mat.transparent = true;
        mat.opacity = 1.0;

        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(grid_size, buildThick, grid_size), mat)
        floorMesh.castShadow = true
        floorMesh.receiveShadow = true;
        scene.add(floorMesh)
            const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz))
            const floorShape = RAPIER.ColliderDesc.cuboid(grid_size/2, buildThick/2, grid_size/2).setMass(1).setRestitution(0.0).setFriction(0.0)
            const floorCollider = world.createCollider(floorShape, floorBody)
            floorCollider.build_id = build_id;
        ArrayMesh.push(floorMesh);
        ArrayBody.push(floorBody);

        mAddBuild(floorCollider, floorMesh, floorBody)
        build_id += 1; 
    }

    mCreateFloor(-grid_size*4+grid_size/2, gridH_size*3, -grid_size*5+grid_size/2)
    mCreateFloor(-grid_size*3+grid_size/2, gridH_size, -grid_size*3+grid_size/2)


    //--- Player
    let ArrayPlayerCollider = [];
    let playerBodyMesh = new THREE.Group();
        const playerBodyStandMesh = new THREE.Mesh(new THREE.CapsuleGeometry(playerRadius, playerRadius*3), new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: true}))
        playerBodyStandMesh.castShadow = false
        playerBodyMesh.add(playerBodyStandMesh);
            const playerBodySquatMesh = new THREE.Mesh(new THREE.CapsuleGeometry(playerRadius, playerRadius*1.5), new THREE.MeshBasicMaterial({color: 'red', wireframe: true}))
            playerBodySquatMesh.position.set(0, -playerRadius*0.75, 0);
            playerBodySquatMesh.castShadow = false
            playerBodySquatMesh.visible = false
            playerBodyMesh.add(playerBodySquatMesh)
        playerBodyMesh.visible = false;
    scene.add(playerBodyMesh)
    ArrayMesh.push(playerBodyMesh);

        const playerBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, playerRadius*5, 0).lockRotations())
        const playerShape = RAPIER.ColliderDesc.capsule(playerRadius*1.5, playerRadius).setMass(1).setRestitution(0.0).setFriction(2.0)
        playerShape.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        let playerCollider = world.createCollider(playerShape, playerBody);
        ArrayPlayerCollider.push(playerCollider);
        //console.log("playerCollider.handle:%o", playerCollider.handle)
        console.log("playerCollider.handle:", playerCollider)

        //const playerSquatBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, playerRadius*5, 0).lockRotations())
        const playerSquatShape = RAPIER.ColliderDesc.capsule(playerRadius*0.75, playerRadius).setMass(1.0).setTranslation(0.0, -playerRadius*0.75, 0.0).setRestitution(0.0).setFriction(0.0)
        playerSquatShape.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        let playerSquatCollider = world.createCollider(playerSquatShape, playerBody);
        playerSquatCollider.setEnabled(false);
        ArrayPlayerCollider.push(playerSquatCollider);

    ArrayBody.push(playerBody);
    //playerBody.setLinearDamping(1.0);

    let characterController = world.createCharacterController(0.01);
    characterController.enableSnapToGround(2);

    function mPlayerIsNotGrounded(){
        //console.log("mPlayerIsNotGrounded")
        if(playerBody && playerCollider){
            playerBody.setGravityScale(1/g_scale, true);
            playerCollider.setFriction(0.0)
        }
        
    }

    function mPlayerIsGrounded(){
        //console.log("mPlayerIsGrounded")
        
        if(playerBody && playerCollider){
            playerBody.setGravityScale(1.0, true);
            playerCollider.setFriction(2.0)
        }
        //if(mixer){
            arrayAction[5].stop();
            //if(!arrayAction[0].isRunning){
            //    arrayAction[0].play();    
            //}
        //}
    }

    //--- Key event ---//
    var keyEnabledArray = Array(222).fill(true);
    let movement = {'forward': false, 'back': false, 'left': false, 'right': false};
    let lastJumpTime = -1; //performance.now();

    $(document).on( 'keydown keyup', (event) => {  

        //console.log("key:"+ event.key)
        
        if(event.key === 'p'  && event.type === 'keydown'){
            if(mPointLock==0){
                //ElementRequestPointerLock(canvas2d);
                mEnablePointerLock();
            }
            else{
                DocumentExitPointerLock(document);
            }
        }
        
    
        const KeyToCommand = {
            'W': 'forward',
            'S': 'back',
            'A': 'left',
            'D': 'right',
        };
        const command = KeyToCommand[event.key.toUpperCase()];
        if(command){
            //console.log('command:'+ command +', '+ event.type)
            if(event.type === 'keydown'){
                movement[command] = true;
            }else{ /* keyup */
                movement[command] = false;    
            }
            //console.log('movement:%o', movement)
            
        }

        if(event.key === ' '  && event.type === 'keydown'){
            //console.log('space');
            
            if(c_player && c_player.isGrounded ){
                
                /*
                let vx = playerBody.linvel().x;
                let vy = playerBody.linvel().y;
                let vz = playerBody.linvel().z;
                //playerBody.setLinvel({ x: vx, y: 0, z: vz}, true);
                playerBody.applyImpulse({ x: vx, y: 6, z: vz }, true);
                //playerBody.applyImpulse({ x: 0.0, y: 6, z: 0.0 }, true);
                lastJumpTime = performance.now();
                c_player.isGrounded = false;
                mPlayerIsNotGrounded() */
                c_player.isJump = true;
            }
            
        }

        if(event.key === 'Shift'  && event.type === 'keydown'){
            if(c_player.slidingPressedTime < 0){
                c_player.slidingPressedTime = new Date().getTime();
            }
            c_player.isSliding = false;
            //console.log('c_player.slidingPressedTime:'+c_player.slidingPressedTime);
        }
        if(event.key === 'Shift'  && event.type === 'keyup'){
            //console.log('Shift');
            c_player.slidingPressedTime = -1;
            //console.log('c_player.isSliding:'+c_player.isSliding);
            if( !c_player.isSliding ){
                if(c_player && c_player.isGrounded ){
                    if(c_player.isCrouch){
                        c_player.isCrouch = false;
                        /*playerCollider.setEnabled(true)
                        playerSquatCollider.setEnabled(false)
                        playerBodyStandMesh.visible = true
                        playerBodySquatMesh.visible = false*/
                        mSetPlayerColliderCrouch(false)
                    }else{
                        c_player.isCrouch = true;
                        /*playerSquatCollider.setEnabled(true)
                        playerCollider.setEnabled(false)
                        playerBodyStandMesh.visible = false
                        playerBodySquatMesh.visible = true*/
                        mSetPlayerColliderCrouch(true)
                    }
                    //console.log('c_player.isCrouch:', c_player.isCrouch);
                }
            }else{
                c_player.isSliding = false;
            }
            
        }
    
        if(event.key === 'f'  && event.type === 'keydown'){
            if(c_player){
                c_player.weapon = 0;
                //weaponMesh.visible = false;
                console.log('c_player.weapon:', c_player.weapon);
            }
        }
        /*if(event.key === '1'  && event.type === 'keydown'){
            if(c_player){
                c_player.weapon = 1;
                weaponMesh.visible = true;
                console.log('c_player.weapon:', c_player.weapon);
            }
        }*/
        
        if(keyEnabledArray[event.keyCode] && event.type === 'keydown') {
            keyEnabledArray[event.keyCode] = false;
            //console.log('keydown:'+event.keyCode+","+keyEnabledArray[event.keyCode])
        }
    
        if( event.type === 'keyup') {
            keyEnabledArray[event.keyCode] = true;
            //console.log('keyup:'+event.keyCode+","+keyEnabledArray[event.keyCode])
        }
    
    });

    function mSetPlayerColliderCrouch(isCrouch){
        //console.log("mSetPlayerColliderCrouch:",isCrouch)
        playerCollider.setEnabled(!isCrouch)
        playerSquatCollider.setEnabled(isCrouch)
        playerBodyStandMesh.visible = !isCrouch
        playerBodySquatMesh.visible = isCrouch
    }
    
    //--- Mouse event ---//
    var mMouseSenseX = 0.00065*3; //0.00065 at 10%
    var mMouseSenseY = 0.00065*3; //
    let c_player = new Object();
    c_player.angle_offset_init = Math.PI;
    c_player.angle_offset = c_player.angle_offset_init;
    c_player.angle = 0; //Math.PI;
    c_player.angle2 = 0;
    c_player.isGrounded = false;
    c_player.isOnSlope = false;
    c_player.isJump = false;
    c_player.isCrouch = false;
    c_player.slidingPressedTime = -1;
    c_player.isSliding = false;
    c_player.weapon = 0;
    c_player.isFiring = false;
    c_player.lastFiringTime = -1;
    c_player.firingMesh = null;
    c_player.model = null;


    canvas2d.addEventListener('mousemove', function(e)
    {
        //console.log("mousemove:");
        
        if(c_player){

            var ang_ = (e.movementX) * mMouseSenseX * Math.PI/2;
            var ang2_ = (e.movementY) * mMouseSenseY * Math.PI/2;

            
            if(camera.zoom > 1 ){
                ang_ *= 0.5;
                ang2_ *= 0.5
            }
            

            //console.log("ang_:"+ang_);
            c_player.angle -= ang_;
            c_player.angle2 -= ang2_;
            c_player.angle2 = Math.max(-Math.PI/2, c_player.angle2);
            c_player.angle2 = Math.min( Math.PI/2, c_player.angle2);
            //console.log("c_player.angle:"+c_player.angle/Math.PI*180);
            //console.log("c_player.angle2:"+c_player.angle2/Math.PI*180);
            //c_player.weaponMesh.rotation.x = -c_player.angle2;
            playerPiv1.rotation.x = -c_player.angle2;
        }
        
    });

    canvas2d.addEventListener('mousedown', function(e)
    {
        //console.log('mousedown')

        if(c_player){

            //if(c_player.mode==1){ //(mMode==1){
                if(e.button==0){
                    if((c_player.weapon!=5) ){ // (c_player.weapon<=3)   //(c_player.weapon<=4)||(c_player.weapon==6)
                        //movement['shoot'] = true;
                        //ws.send("shoot " + 1);
                        c_player.isFiring = true;
                        //c_player.lastFiringTime = -1;
                        //console.log("c_player.isFiring:"+c_player.isFiring);
                    }
                    
                }//    
                else if(e.button==2){
                    camera.zoom = 3; //1.001;
                    camera.updateProjectionMatrix();
                    c_player.model.visible = false;
                    c_player.weaponMesh.visible = true;
                }  
                
            //}//
           
            if( (e.button==2) ){
                //ws.send('scope '+ 1)
            }

        }//c_player

    });

    canvas2d.addEventListener('mouseup', function(e)
    {
        if(c_player){

            if(e.button==0){
                //movement['shoot'] = false;
                //socket.emit('movement', movement);
                //ws.send("shoot " + 0);
                c_player.isFiring = false;
                //c_player.lastFiringTime = new Date().getTime();
                //console.log("c_player.isFiring:"+c_player.isFiring);
                
            }//

            if(e.button==2){
                camera.zoom = 1;
                camera.updateProjectionMatrix();
                //socket.emit('readyShoot', 0);
                c_player.model.visible = true;
                c_player.weaponMesh.visible = false;
            }

        }//
    });



    const gui = new GUI();
    props = {
        //showAxes: true,
        showCollision: false,
        showShadow: true,
        rayCast: false,
        hitSound: false,
        //pointerLock: false,
    };
    //gui.add( props, 'showAxes').name('Show axes')
    gui.add( props, 'showCollision').name('Show collision').onChange( value => {
        playerBodyMesh.visible = value;
      })
    gui.add( props, 'showShadow').name('Show shadow').onChange( value => {
        light.castShadow = value;
      })
    /*gui.add( props, 'pointerLock').name('Pointer lock').onChange( value => {
        if(value){
            mEnablePointerLock();
        }else{
            DocumentExitPointerLock(document);
        }
      })*/
    gui.add( props, 'rayCast').name('Ray cast').onChange( value => {
        
        })
    gui.add( props, 'hitSound').name('Hit sound').onChange( value => {
        
        })

    const clock = new THREE.Clock();
    let delta
    let player_speed = mScale * 5; // [/ms]
    let last_game_time = new Date().getTime(); //[ms]
    let current_game_time = new Date().getTime(); //[ms]
    let playerLastPosition = new THREE.Vector3(0,0,0)
    let playerNewPosition = new THREE.Vector3(0,0,0)
    let playerMoveDirection = new THREE.Vector3(0,0,0)
    let playerPlaneMoveDistance = new THREE.Vector3(0,0,0)
    let t = 0;
    let lastGroundedTime = -1; //performance.now();
    let camera_dir = new THREE.Vector3();
    let eventQueue = new RAPIER.EventQueue(true);
    let ArrayHitMesh = new Array();

    let line_geo = new THREE.LineSegmentsGeometry();
    let matLine = new THREE.LineMaterial( {
        color: "orange", //0xffffff, does not work
        linewidth: 5, // in world units with size attenuation, pixels otherwise
        vertexColors: true,
        resolution,  // to be set by renderer, eventually
        dashed: false,
        alphaToCoverage: true,
    } );
    let node_vertices = [];
    let colors = [];
    colors.push( 255, 255, 255 );
    colors.push( 255, 255, 255 );

    function mSetPlayerAnimation(){

        if ( mixer ) {
            mixer.update( delta );

            /*if(c_player.weapon == 1){
                arrayAction[0].stop();
                arrayAction[6].stop();
                if(!c_player.isCrouch){
                    arrayAction[14].stop();
                    if(c_player.isFiring){
                        arrayAction[13].play();
                        //console.log('play')
                    }else{
                        arrayAction[13].play();
                        arrayAction[13].reset();
                    }
                }else{
                    let wx = mWeaponOffset.dx;
                    let wy = mWeaponOffset.dy;
                    let wz = mWeaponOffset.dz;
                    weaponMesh.position.set(wx,wy*0,wz);
                    arrayAction[13].stop();
                    if(c_player.isFiring){
                        arrayAction[14].play();
                    }else{
                        arrayAction[14].play();
                        arrayAction[14].reset();
                    }
                }

                return
            }else{
                arrayAction[13].stop();
                arrayAction[14].stop();
                //arrayAction[0].play();
                //arrayAction[13].reset();
            }*/

        
            if( c_player.isGrounded ){
                mPlayerIsGrounded()
                lastGroundedTime = current_game_time //currentTime
                if(arrayAction[5].isRunning()){
                    arrayAction[5].stop();
                }
            }else{
                if(arrayAction[0].isRunning()){
                    arrayAction[0].stop();
                }
                if(!arrayAction[5].isRunning()){
                    arrayAction[5].play();
                }
            }
    
            //console.log("c_player.isGrounded:"+c_player.isGrounded)
            //console.log("currentTime:" + currentTime +" lastGroundedTime:"+lastGroundedTime)
    
            
            if( (!movement.forward) && (!movement.back) && (!movement.left) && (!movement.right) ){
                if(!c_player.isCrouch){
                    if(arrayAction[6].isRunning()){
                        arrayAction[6].stop();
                    }
                    if(!arrayAction[0].isRunning()){
                        arrayAction[0].play();
                    }
                }else{
                    //console.log("crouch")
                    if(arrayAction[0].isRunning()){
                        arrayAction[0].stop();
                    }
                    if(!arrayAction[6].isRunning()){
                        arrayAction[6].play();
                    }
                }
            }else{
                arrayAction[0].stop();
                arrayAction[6].stop();
            }
    
            if(movement.forward){
                if(!c_player.isCrouch){
                    arrayAction[7].stop();
                    arrayAction[1].play();
                }else{
                    arrayAction[1].stop();
                    arrayAction[7].play();
                }
            }else{
                arrayAction[1].stop();
                arrayAction[7].stop();
            }
    
            if(movement.back){
                //arrayAction[2].play();
                if(!c_player.isCrouch){
                    arrayAction[8].stop();
                    arrayAction[2].play();
                }else{
                    arrayAction[2].stop();
                    arrayAction[8].play();
                }
            }else{
                arrayAction[2].stop();
                arrayAction[8].stop();
            }
    
            if( movement.left && !movement.forward && !movement.back){
                //arrayAction[3].play();
                if(!c_player.isCrouch){
                    arrayAction[9].stop();
                    arrayAction[3].play();
                }else{
                    arrayAction[3].stop();
                    arrayAction[9].play();
                }
            }else{
                arrayAction[3].stop();
                arrayAction[9].stop();
            }
    
            if( movement.right && !movement.forward && !movement.back){
                //arrayAction[4].play();
                if(!c_player.isCrouch){
                    arrayAction[10].stop();
                    arrayAction[4].play();
                }else{
                    arrayAction[4].stop();
                    arrayAction[10].play();
                }
            }else{
                arrayAction[4].stop();
                arrayAction[10].stop();
            }   
    
            if( current_game_time > c_player.slidingPressedTime + 300 && c_player.slidingPressedTime > 0 ){
                c_player.isSliding = true;
                //c_player.slidingPressedTime = -1;
            }
    
            if(c_player.isSliding){
                //console.log('c_player.isSliding:'+c_player.isSliding);
                arrayAction[1].stop();
                if(!arrayAction[11].isRunning()){
                    arrayAction[11].play();
                }
                mSetPlayerColliderCrouch(true)
            }else{
                //console.log('c_player.isSliding:'+c_player.isSliding);
                arrayAction[11].stop();
                if(!c_player.isCrouch){
                    mSetPlayerColliderCrouch(false)
                }
                
            }
    
            
    
            //for(var i=0; i<arrayAction.length; i++){
            //    if(arrayAction[i]){
            //        console.log("arrayAction["+i+"]:"+arrayAction[i].isRunning() );
            //    }  
            //}
                
            }// mixer
    

    }

    tick();
    function tick() {
        stats.begin();

        if (world==null){
            return
        }
        //if ( mixer ){
        //}else{
        //    return
        //}
        
        delta = clock.getDelta()
        //if (world) {

        playerLastPosition.copy(playerNewPosition)

        //delta_world = clock.getDelta()
        world.timestep = Math.min(delta, 0.01)
        world.step(eventQueue)
        //console.log("delta:%o", delta)
        //console.log("world:%o", world)
        //console.log("d_world:"+dt_world)

        playerNewPosition.copy(playerBody.translation())

        for(var i = 0; i < ArrayMesh.length; i++){
            ArrayMesh[i].position.copy(ArrayBody[i].translation())
            ArrayMesh[i].quaternion.copy(ArrayBody[i].rotation())
        }
        
        playerMesh.position.copy(playerBody.translation())
        //playerMesh.quaternion.copy(playerBody.rotation())
        //console.log("sphereBody.position:%o", sphereBody.position)
        //console.log("playerBody.translation:%o", playerBody.translation())
        //console.log("playerBody.translation:%o", playerBody.translation().x)

        //playerMesh.position.copy(playerBody.position)
        //if( t%10 == 0){
        //  console.log("playerBody.position:%o", playerBody.position)
        //}

        //if( t%100 == 0){
            //c_player.isGrounded = false;
            //c_player.isOnSlope = false;
            
            eventQueue.drainContactForceEvents(event => {
                //console.log("event:")
                let handle1 = event.collider1(); // Handle of the first collider involved in the event.
                let handle2 = event.collider2(); // Handle of the second collider involved in the event.
                // Handle the contact force event. 
                //console.log("contact:%o, %o", handle1, handle2)
                //console.log("contact:%o", event.totalForce())
                let time_now = new Date().getTime(); //performance.now();
                for(var i = 0; i < ArrayPlayerCollider.length; i++){
                    let h = ArrayPlayerCollider[i].handle
                    //if(handle1==playerCollider.handle || handle2==playerCollider.handle){
                    if(handle1==h || handle2==h){
                        //console.log("contact:%o", event.totalForce())
                        if(event.totalForce().y > 1 && time_now > lastJumpTime + 100  ){ // 
                            //lastGroundedTime = performance.now();
                            lastGroundedTime = time_now;
                            c_player.isGrounded = true;
                        
                            if( Math.abs(event.totalForce().x) > 1.0 || Math.abs(event.totalForce().z) > 1.0){
                                c_player.isOnSlope = true;
                            }else{
                                c_player.isOnSlope = false;
                            }
                        }
                    }
                } //i
                    
            });
            
            //console.log("c_player.isGrounded:", c_player.isGrounded)
            //console.log("c_player.isOnSlope:", c_player.isOnSlope)
        //}

        if(props.rayCast){
            //console.log("camera pos:", camera.position)
            //let camera_dir = new THREE.Vector3();
            camera.getWorldDirection(camera_dir)
            //console.log("camera dir:", camera_dir)

            let cp = camera.position;
            let ray = new RAPIER.Ray({ x: cp.x, y: cp.y, z: cp.z }, { x: camera_dir.x, y: camera_dir.y, z: camera_dir.z });
            let maxToi = grid_size*grid_num;
            let solid = false;

            let hit = world.castRay(ray, maxToi, solid);
            if (hit != null) {
                // The first collider hit has the handle `hit.colliderHandle` and it hit after
                // the ray travelled a distance equal to `ray.dir * toi`.
                let hitPoint = ray.pointAt(hit.timeOfImpact); // Same as: `ray.origin + ray.dir * toi`
                //console.log("Collider", hit.collider, "hit at point", hitPoint);
                //console.log("hit.timeOfImpact:", hit.timeOfImpact);
                if(hit.timeOfImpact >= mCameraOffset.dz){
                    const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius*0.1), new THREE.MeshBasicMaterial({color: 'orange'}))
                    hitMesh.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
                    ArrayHitMesh.push(hitMesh);
                    scene.add(hitMesh)
                    if(ArrayHitMesh.length>100){
                        let delMesh = ArrayHitMesh[0];
                        scene.remove(delMesh);
                        ArrayHitMesh.shift();
                    }
                    if(props.hitSound){
                        mPlayAudioBuffer(mArrayAudio[0]);
                    }

                }//
            }
        }//

        //}

        current_game_time = new Date().getTime();
        let dt = current_game_time - last_game_time;
        //console.log("dt:"+dt);
        last_game_time = current_game_time;

        t += 1;
          
        
        mSetPlayerAnimation()


        if (playerMesh != null){

            if( playerBody.translation().y < -gridH_size ){ // init
                playerBody.setTranslation({ x: 0.0, y: gridH_size, z: 1.0 }, true)
            }
    
            if(current_game_time > lastGroundedTime + 10  ){ // Fall
                //console.log("Fall:")
                c_player.isGrounded = false;
                c_player.isOnSlope = false;
                mPlayerIsNotGrounded()
            }    

            if(c_player.isJump){
                //console.log('jump');
                c_player.isGrounded = false;
                c_player.isOnSlope = false;
                mPlayerIsNotGrounded()
                let vx = playerBody.linvel().x;
                let vy = playerBody.linvel().y;
                let vz = playerBody.linvel().z;
                //playerBody.setLinvel({ x: vx, y: 0, z: vz}, true);
                //playerBody.applyImpulse({ x: vx, y: 6, z: vz }, true);
                playerBody.applyImpulse({ x: 0.0, y: 6, z: 0.0 }, true);
                lastJumpTime = new Date().getTime(); // performance.now();
                
                c_player.isJump = false;
            }
            
            let move_num = movement.forward + movement.back + movement.left + movement.right;
                //console.log("move_num:"+move_num);
            let dis = player_speed * dt;
            let spd = player_speed;
            if(move_num == 2){
                dis /= Math.sqrt(2);
                spd /= Math.sqrt(2);
            }else if(move_num==0){
                spd = 0;
            }

            if(c_player.isCrouch){
                spd /= 2;
            }

            
            let a1 = c_player.angle;
            let s = playerBody.linvel();
            //console.log("playerBody.linvel():%o", playerBody.linvel());

            if(s.y < -10){
                playerBody.setLinvel({ x: s.x, y: -10, z: s.z}, true);
                s = playerBody.linvel();
            }

            let input_sx = 0;
            let input_sz = 0;
            if(movement.forward){
                input_sz += -spd * Math.cos(a1);
                input_sx += -spd * Math.sin(a1);
            }
            if(movement.back){
                input_sz += spd * Math.cos(a1);
                input_sx += spd * Math.sin(a1);
            }
            if(movement.left){
                input_sx += -spd * Math.cos(a1);
                input_sz +=  spd * Math.sin(a1);
            }
            if(movement.right){
                input_sx +=  spd * Math.cos(a1);
                input_sz += -spd * Math.sin(a1);
            }

            if(c_player.isGrounded){
                //console.log('input');
                playerBody.setLinvel({ x: input_sx, y: s.y, z: input_sz}, true);
            }else{
                let s2x = s.x + input_sx*delta;
                let s2z = s.z + input_sz*delta;
                let s2_mag = Math.sqrt(s2x*s2x+s2z*s2z);
                let sc = 1.0;
                if(s2_mag > player_speed){
                    sc = player_speed / s2_mag;
                    s2x *= sc;
                    s2z *= sc;
                }
                playerBody.setLinvel({ x: s2x, y: s.y, z: s2z}, true);
            }

            if(playerBody){
                //console.log(playerBody.gravityScale());
                let vx = playerBody.linvel().x;
                let vy = playerBody.linvel().y;
                let vz = playerBody.linvel().z;
                let vmag = Math.sqrt(vx*vx+vy*vy+vz*vz)
                //console.log("vmag:"+vmag);

                //playerMoveDirection.copy(playerNewPosition).sub(playerLastPosition).normalize();
                //console.log("playerMoveDirection:%o", playerMoveDirection);

                //let dis = playerMoveDirection.copy(playerNewPosition).sub(playerLastPosition).length();
                //console.log("dis:%o", dis/delta);

                playerPlaneMoveDistance.copy(playerNewPosition).sub(playerLastPosition);
                let vertical_spd = playerPlaneMoveDistance.y /delta;
                playerPlaneMoveDistance.y = 0;
                let plane_spd = playerPlaneMoveDistance.length() /delta;
                //console.log("plane_spd:%o", plane_spd);
                //console.log("vertical_spd:%o", vertical_spd);

                if(move_num > 0 && c_player.isOnSlope && plane_spd < player_speed * 0.8  ){
                    /*let spd_scale = player_speed / current_spd;
                        //console.log("player_speed:%o", player_speed);
                    console.log("spd_scale:%o", spd_scale);
                    playerBody.setLinvel({ x: input_sx*spd_scale, y: s.y, z: input_sz*spd_scale}, true);*/
                    playerBody.setLinvel({ x: input_sx, y: player_speed*4/5, z: input_sz}, true);
                }

            }

            c_player.angle_offset = c_player.angle_offset_init;
            if(c_player.model){
                c_player.model.rotation.y = 0;
            }
            
            if(movement.forward && movement.right){
                //c_player.angle_offset = c_player.angle_offset_init + Math.PI/4;
                c_player.model.rotation.y =  -Math.PI/4;
            }else if(movement.forward && movement.left){
                //c_player.angle_offset = c_player.angle_offset_init - Math.PI/4;
                c_player.model.rotation.y =  Math.PI/4;
            }else if(movement.back && movement.right){
                //c_player.angle_offset = c_player.angle_offset_init - Math.PI/4;
                c_player.model.rotation.y =  Math.PI/4;
            }else if(movement.back && movement.left){
                //c_player.angle_offset = c_player.angle_offset_init + Math.PI/4;
                c_player.model.rotation.y =  -Math.PI/4;
            }

            playerMesh.rotation.y = c_player.angle - c_player.angle_offset;

            if(c_player.model && c_player.weapon==1 && !c_player.isCrouch){
                let ang2 = c_player.angle2;
                c_player.model.traverse(function(obj) {
                    if(obj.name == "mixamorigSpine"){
                        //console.log("obj.name:" + obj.name)
                            obj.rotation.x = -ang2;
                            //obj.rotation.y = props[Array_v[i*3+1]]/180*3.1415;
                            //obj.rotation.z = props[Array_v[i*3+2]]/180*3.1415;
                    }
                })

                /*let wx = mWeaponOffset.dx;
                let wz = mWeaponOffset.dz;
                let wy = mWeaponOffset.dy;
                let pz = Math.cos(ang2) * wz - Math.sin(ang2) * wy;
                let py = Math.sin(ang2) * wz + Math.cos(ang2) * wy;
                weaponMesh.position.set(wx,py,pz);
                weaponMesh.rotation.x = -ang2;*/
            };

            if(c_player.isFiring && current_game_time > c_player.lastFiringTime + 100){
                mPlayAudioBuffer(mArrayAudio[1])
                c_player.lastFiringTime = new Date().getTime();

                camera.getWorldDirection(camera_dir)
                //console.log("camera dir:", camera_dir)

                node_vertices = [];
                if(camera.zoom > 1){
                    let wp = muzzlePos.getWorldPosition(new THREE.Vector3());
                    node_vertices.push(wp.x, 
                        wp.y, 
                        wp.z);
                }else{
                    node_vertices.push(playerMesh.position.x, 
                        playerMesh.position.y + mCameraOffset.dy * (0.95 -  0.65*(c_player.isCrouch || c_player.isSliding) ), 
                        playerMesh.position.z);
                }
                

                /*let cp = camera.position;
                let ray = new RAPIER.Ray({ x: cp.x, y: cp.y, z: cp.z }, { x: camera_dir.x, y: camera_dir.y, z: camera_dir.z });
                let maxToi = grid_size*grid_num*2;
                let solid = false;
                let hit = world.castRay(ray, maxToi, solid);*/
                let {hit, ray} = mCameraRayHit(camera);

                let hitPoint;
                if (hit != null) {
                    hitPoint = ray.pointAt(hit.timeOfImpact); // Same as: `ray.origin + ray.dir * toi`
                    //console.log("Collider", hit.collider, "hit at point", hitPoint);
                    //console.log("hit.timeOfImpact:", hit.timeOfImpact);
                    if(hit.timeOfImpact >= mCameraOffset.dz){
                        const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius*0.1), new THREE.MeshBasicMaterial({color: 'orange'}))
                        hitMesh.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
                        ArrayHitMesh.push(hitMesh);
                        scene.add(hitMesh)
                        if(ArrayHitMesh.length>100){
                            let delMesh = ArrayHitMesh[0];
                            scene.remove(delMesh);
                            ArrayHitMesh.shift();
                        }
                        mPlayAudioBuffer(mArrayAudio[0]);
                    }//

                    node_vertices.push(hitPoint.x, hitPoint.y, hitPoint.z);
                    mBuildDamage(hit);
                    
                }else{
                    let p0 = camera.position;
                    let d = camera_dir; 
                    let L = grid_size * grid_num;
                    //console.log("L:", L);
                    node_vertices.push(p0.x + d.x * L, p0.y + d.y * L, p0.z + d.z * L);
                }
                
                mCreateFiringMesh(node_vertices)
                weaponMesh.position.z = mWeaponOffset.dz *1.02;
                //console.log("weaponMesh:", weaponMesh)
                //console.log("weaponMesh:", weaponMesh.getWorldPosition(new THREE.Vector3()))
            }

            if( current_game_time > c_player.lastFiringTime + 50){
                if(c_player.firingMesh!=null){
                    scene.remove(c_player.firingMesh);
                    c_player.firingMesh = null;
                }
                weaponMesh.position.z = mWeaponOffset.dz;
            }

            mSetCameraPosition(camera, mCameraOffset, c_player); //playerMesh
            light.position.set(light_pos0.x + playerNewPosition.x, 
                               light_pos0.y + playerNewPosition.y, 
                               light_pos0.z + playerNewPosition.z);
 
        }
        renderer.render(scene, camera);
        requestAnimationFrame(tick);

        stats.end();
    }

    function mCameraRayHit(camera_){
        let dir = new THREE.Vector3();
        camera_.getWorldDirection(dir)
        let cp = camera_.position;
        let ray = new RAPIER.Ray({ x: cp.x, y: cp.y, z: cp.z }, { x: dir.x, y: dir.y, z: dir.z });
        let maxToi = grid_size*grid_num*2;
        let solid = false;
        let hit = world.castRay(ray, maxToi, solid);
        return {hit: hit, ray: ray};
    }

    function mCreateFiringMesh(vertices){
        line_geo.setPositions( vertices );
        line_geo.setColors( colors );
        //let line = new THREE.LineSegments2( line_geo, matLine );
        //line.computeLineDistances();
        //scene.add( line );
        c_player.firingMesh = new THREE.LineSegments2( line_geo, matLine );
        c_player.firingMesh.computeLineDistances();
        scene.add( c_player.firingMesh );
    }

    function mBuildDamage(hit){
        //console.log("Collider:", hit.collider)
        //let b = ArrayBuild[hit.collider.handle];
        let b = ArrayBuild[hit.collider.build_id];
        //console.log("b:%o", b);
        if(b!=null){
            //console.log("ArrayBuild:%o", ArrayBuild);
            b.health -= 30;
            b.buildMesh.material.opacity = b.health / b.maxHealth * 0.5 + 0.5;
            //console.log("b.buildMesh.material.opacity:%o", b.buildMesh.material.opacity);
            if(b.health<=0){
                //b.buildMesh.material.opacity = 1;
                mDestroyBuild(b);
            }
        }
    }

    function mDestroyBuild(b){
        if(b!=null){
            scene.remove(b.buildMesh);
            b.buildMesh = null;
            world.removeCollider(b.collider);
            mPlayAudioBuffer(mArrayAudio[2], 2.0);
        }
    }
    

    onResize();
    window.addEventListener('resize', onResize);
    function onResize() {
        width = document.getElementById('main_canvas').getBoundingClientRect().width;
        height = document.getElementById('main_canvas').getBoundingClientRect().height;

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        renderer.getSize(resolution);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        //console.log(width);

        mDraw2Dcontext()
    }

    //Pointer lock
    let mPointLock = 0;
    function ElementRequestPointerLock(element){
        mPointLock = 1;
        var list = [
            "requestPointerLock",
            "webkitRequestPointerLock",
            "mozRequestPointerLock"
        ];
        var i;
        var num = list.length;
        for(i=0;i < num;i++){
            if(element[list[i]]){
                element[list[i]]();
                return true;
            }
        }
        return false;
    }

    function DocumentExitPointerLock(document_obj){
        mPointLock = 0;
        var list = [
            "exitPointerLock",
            "webkitExitPointerLock",
            "mozExitPointerLock"
        ];
        var i;
        var num = list.length;
        for(i=0;i < num;i++){
            if(document_obj[list[i]]){
                document_obj[list[i]]();
                return true;
            }
        }
        return false;
    }

    function mEnablePointerLock(){
        setTimeout(() => {
            ElementRequestPointerLock(canvas2d); //->needs action to enable pointer lock
        }, 1000);
    }
    
    //---Description
    function mDraw2Dcontext(){
        //const canvas2d = document.querySelector( '#canvas-2d' );
        var W_ = canvas2d.width;
        var H_ = canvas2d.height;
        console.log("canvas2d:"+W_+", "+H_)
        canvas2d.setAttribute("width", width);
        canvas2d.setAttribute("height", height);
        W_ = canvas2d.width;
        H_ = canvas2d.height;
        console.log("canvas2d:"+W_+", "+H_)

        const context2d = canvas2d.getContext('2d');
        let fontSize = W_/100;
        context2d.font = fontSize + 'px Bold Arial';
        context2d.fillStyle = "white"
        context2d.textAlign = "center"
        context2d.fillText(
            "P: pointer lock,  WASD: move,  Space: jump,  Shift: crouch,  Shift(long): slide",
            W_/2, fontSize);
        context2d.fillText(
            "Mouse move: player's view direction, Left click: shoot, Right click: ADS",
            W_/2, fontSize*2);         
        //context2d.fillStyle = "blue"
        //context2d.fillRect(100, 100, 1000, 1000);

        let w_ = W_ / 50;
        context2d.strokeStyle = "white"
        context2d.lineWidth = 1;
        context2d.beginPath();
        context2d.moveTo(W_/2, H_/2-w_);
        context2d.lineTo(W_/2, H_/2+w_);
        context2d.moveTo(W_/2-w_, H_/2);
        context2d.lineTo(W_/2+w_, H_/2);
        context2d.closePath();
        context2d.stroke();
    }
    mDraw2Dcontext()

}//init