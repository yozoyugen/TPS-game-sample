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

    let width = window.innerWidth;
    let height = window.innerHeight;

    const canvas2d = document.querySelector( '#canvas-2d' );
    var W_ = canvas2d.width;
    var H_ = canvas2d.height;
    console.log("canvas2d:"+W_+", "+H_)
    canvas2d.setAttribute("width", width);
    canvas2d.setAttribute("height", height);
    W_ = canvas2d.width;
    H_ = canvas2d.height;
    console.log("canvas2d:"+W_+", "+H_)

    const context2d = canvas2d.getContext('2d');
    //context2d.textAlign = "center"
    //context2d.fillText( "test", 1000, 200);
    //context2d.fillStyle = "blue"
    //context2d.fillRect(100, 100, 1000, 1000);

    
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
 
    const scene = new THREE.Scene();

    let mScale = 1;
 
    let camera = new THREE.PerspectiveCamera(80, width / height, mScale*0.01, mScale * 100);
    let mCameraOffset = new Object();
    mCameraOffset.dx = mScale*0.1;
    mCameraOffset.dy = mScale*0.8; //1.4
    mCameraOffset.dz = mScale*2.0; //1000*1.6;
    
    function mSetCameraPosition(camera, offset, model){
        let p = model.position;
        let dx = offset.dx; // 1000*0.1;
        let dy = offset.dy; //1000*1.4;
        let dz = offset.dz; //1000*1.6;
        //camera.position.set(p.x + dx, p.y + dy, p.z + dz);
        //camera.lookAt(new THREE.Vector3(p.x + dx, p.y + dy, p.z));

        if(c_player){    
            let a1 = c_player.angle;
            let a2 = -c_player.angle2;
            camera.position.set(
                p.x + ( Math.sin(a1) * Math.cos(a2) * dz + Math.cos(a1) * dx ), 
                p.y + dy + dz * Math.sin(a2), 
                p.z + ( Math.cos(a1) * Math.cos(a2) * dz - Math.sin(a1) * dx )
            );
            
            camera.rotation.order = "YXZ";
            camera.rotation.y =  a1;// - Math.PI/2;
            camera.rotation.x = -a2;
        }
    }

    //--- Character model ---//
    //const url = '/mTPS-game-sample/model/no0.glb';
    
    let playerMesh = new THREE.Group();
    let playerRadius = 0.35 * mScale;
    //playerMesh.castShadow = true;
    //playerMesh.receiveShadow = true;

    let model = null;
    let mAxes = null;
    
    let mixer;
    let props, lastAnimID;
    let arrayAction = new Array(8); //[];
    let mAnimOrder = {Idle:0, RunForward:1, RunBack:2, RunLeft:3, RunRight:4, Jump:5, CrouchIdle:6, CrouchForward:7};
    let model_scale = mScale*0.01;  // 10;
    const loader = new THREE.FBXLoader();
    loader.load( 'model/mSet8.fbx', function ( object ) {

        console.log("object:%o", object);
        //object.children[1].visible = false;

        mixer = new THREE.AnimationMixer( object );
        console.log("object.animations.length:"+object.animations.length)
        for(var i = 0; i<object.animations.length; i++){
            console.log("%o", object.animations[ i ]);
            //arrayAction.push( mixer.clipAction(object.animations[ i ]) );
            arrayAction[ mAnimOrder[object.animations[i].name] ] = mixer.clipAction(object.animations[ i ]);
        }
        arrayAction[0].play();
        //arrayAction[6].play();

        arrayAction[5].setLoop(THREE.LoopOnce);
        arrayAction[5].clampWhenFinished = true;

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        //--- Axis ---//
        const size = mScale*0.1;
        mAxes = new THREE.AxesHelper(size);
        mAxes.position.x =  0;
        mAxes.position.y = mScale*0.01; 
        //mAxes.position.y = 2000; 
        playerMesh.add(mAxes);

        //object.position.set(0, 0, 0);
        //scene.add( object );

        object.scale.set(model_scale, model_scale, model_scale);
        object.position.set(0, -playerRadius*2.5, 0);
        playerMesh.add(object);
        scene.add( playerMesh );

        mSetCameraPosition(camera, mCameraOffset, playerMesh);
    } );


    let grid_size = mScale*5;
    let gridH_size = mScale*4;
    let buildThick = mScale*0.1;
    let grid_num = 10;

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
    let mBuildMaterial = new THREE.MeshLambertMaterial({color: 0x6699FF})

    //--- Cube
    const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mBuildMaterial)
    cubeMesh.castShadow = true
    scene.add(cubeMesh)
        const cubeBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(grid_size*0, 1, -grid_size))
        const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape, cubeBody)
    ArrayMesh.push(cubeMesh);
    ArrayBody.push(cubeBody);

    const cubeMesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mBuildMaterial)
    cubeMesh1.castShadow = true
    scene.add(cubeMesh1)
        const cubeBody1 = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(grid_size*1, 0.5, -grid_size))
        const cubeShape1 = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape1, cubeBody1)
    ArrayMesh.push(cubeMesh1);
    ArrayBody.push(cubeBody1);

    const cubeMesh2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mBuildMaterial)
    cubeMesh2.castShadow = true
    scene.add(cubeMesh2)
        const cubeBody2 = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(grid_size*2, 2.5, -grid_size))
        const cubeShape2 = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.0).setFriction(0.0)
        world.createCollider(cubeShape2, cubeBody2)
    ArrayMesh.push(cubeMesh2);
    ArrayBody.push(cubeBody2);

    
    function mCreateWall(px, py, pz){    
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(grid_size, gridH_size, buildThick), mBuildMaterial)
        wallMesh.castShadow = true
        scene.add(wallMesh)
            const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz))
            const wallShape = RAPIER.ColliderDesc.cuboid(grid_size/2, gridH_size/2, buildThick/2).setMass(1).setRestitution(0.0).setFriction(0.0)
            world.createCollider(wallShape, wallBody)
        ArrayMesh.push(wallMesh);
        ArrayBody.push(wallBody);
    }

    mCreateWall(-grid_size*2+grid_size/2, gridH_size/2, -grid_size*2)
    mCreateWall(-grid_size*3+grid_size/2, gridH_size/2, -grid_size*2)


    function mCreateSlope(px, py, pz, type="z-"){
        console.log("mCreateSlope:"+type)
        let L = Math.sqrt(grid_size*grid_size+gridH_size*gridH_size)
            //console.log("L:"+L)
        let Lx = grid_size
        let Ly = buildThick
        let Lz = L
        const slopeMesh = new THREE.Mesh(new THREE.BoxGeometry(Lx, Ly, Lz), mBuildMaterial)
        slopeMesh.castShadow = true
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
        ArrayMesh.push(slopeMesh);
        ArrayBody.push(slopeBody);

        console.log("slopeCollider.handle:", slopeCollider.handle)
    }

    mCreateSlope(-grid_size*5+grid_size/2, gridH_size/2, -grid_size*1+grid_size/2, "z+")

    mCreateSlope(-grid_size*4+grid_size/2, gridH_size/2, -grid_size*2+grid_size/2)
    mCreateSlope(-grid_size*4+grid_size/2, gridH_size*1+gridH_size/2, -grid_size*3+grid_size/2)
    mCreateSlope(-grid_size*4+grid_size/2, gridH_size*2+gridH_size/2, -grid_size*4+grid_size/2)

    function mCreateFloor(px, py, pz){    
        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(grid_size, buildThick, grid_size), mBuildMaterial)
        floorMesh.castShadow = true
        scene.add(floorMesh)
            const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, py, pz))
            const floorShape = RAPIER.ColliderDesc.cuboid(grid_size/2, buildThick/2, grid_size/2).setMass(1).setRestitution(0.0).setFriction(0.0)
            world.createCollider(floorShape, floorBody)
        ArrayMesh.push(floorMesh);
        ArrayBody.push(floorBody);
    }

    mCreateFloor(-grid_size*4+grid_size/2, gridH_size*3, -grid_size*5+grid_size/2)
    mCreateFloor(-grid_size*3+grid_size/2, gridH_size, -grid_size*3+grid_size/2)


    //--- Player
    let ArrayPlayerCollider = [];
    let playerBodyMesh = new THREE.Group();
        const playerBodyStandMesh = new THREE.Mesh(new THREE.CapsuleGeometry(playerRadius, playerRadius*3), new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: true}))
        playerBodyStandMesh.castShadow = false
        playerBodyMesh.add(playerBodyStandMesh);
            //const playerBodySquatMesh = new THREE.Mesh(new THREE.CapsuleGeometry(playerRadius, playerRadius*1.5), new THREE.MeshBasicMaterial({color: 'red', wireframe: true}))
            //playerBodySquatMesh.castShadow = false
            //playerBodyMesh.add(playerBodySquatMesh)
    scene.add(playerBodyMesh)
    ArrayMesh.push(playerBodyMesh);

        const playerBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, playerRadius*5, 0).lockRotations())
        const playerShape = RAPIER.ColliderDesc.capsule(playerRadius*1.5, playerRadius).setMass(1).setRestitution(0.0).setFriction(2.0)
        playerShape.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        let playerCollider = world.createCollider(playerShape, playerBody);
        ArrayPlayerCollider.push(playerCollider);
        //console.log("playerCollider.handle:%o", playerCollider.handle)
        console.log("playerCollider.handle:", playerCollider)

        /*const playerSquatBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, playerRadius*5, 0).lockRotations())
        const playerSquatShape = RAPIER.ColliderDesc.capsule(playerRadius*0.75, playerRadius).setMass(1).setRestitution(0.0).setFriction(2.0)
        playerSquatShape.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        let playerSquatCollider = world.createCollider(playerSquatShape, playerSquatBody);
        ArrayPlayerCollider.push(playerSquatCollider);*/
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
        if(mixer){
            arrayAction[0].stop();
            arrayAction[5].play();
        }
    }

    function mPlayerIsGrounded(){
        //console.log("mPlayerIsGrounded")
        
        if(playerBody && playerCollider){
            playerBody.setGravityScale(1.0, true);
            playerCollider.setFriction(2.0)
        }
        if(mixer){
            arrayAction[5].stop();
            //if(!arrayAction[0].isRunning){
                arrayAction[0].play();    
            //}
        }
    }
    

    //--- Light ---//
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(0, gridH_size* grid_num, grid_size*3);
    light.intensity = 2; 
    light.castShadow = true;
    console.log("light.shadow.camera:%o", light.shadow.camera);
    light.shadow.camera.top *= grid_size * grid_num ;
    light.shadow.camera.bottom *= grid_size * grid_num ;
    light.shadow.camera.left *= grid_size * grid_num ;
    light.shadow.camera.right *= grid_size * grid_num ;
    light.shadow.mapSize.width = 1024 * 16
    light.shadow.mapSize.height = 1024 * 16
    //light.shadow.camera.near = gridH_size*grid_num
    light.shadow.camera.far = gridH_size*grid_num*1.3;
    scene.add(light);
    //const light = new THREE.SpotLight(0xffffff, 400, 100, Math.PI / 4, 1);
    //light.castShadow = true;
    //scene.add(light);

    const light2 = new THREE.DirectionalLight(0xFFFFFF);
    light2.position.set(grid_size*3, gridH_size* grid_num, 0);
    light2.intensity = 0.5; 
    scene.add(light2);


    //--- Environment ---//
    new THREE.RGBELoader()
        .setPath( 'image/' )
        .load( 'quarry_01_1k.hdr', function ( texture ) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
        } );


    //--- Key event ---//
    var keyEnabledArray = Array(222).fill(true);
    let movement = {'forward': false, 'back': false, 'left': false, 'right': false};
    let lastJumpTime = performance.now();

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
            console.log('Shift');
            if(c_player && c_player.isGrounded ){
                if(c_player.isCrouch){
                    c_player.isCrouch = false;
                }else{
                    c_player.isCrouch = true;
                }
                console.log('c_player.isCrouch:', c_player.isCrouch);
            }
            if(playerCollider){
                //console.log('isEnabled:',playerCollider.isEnabled());
               /* if(playerCollider.isEnabled()){
                    playerCollider.setEnabled(false);
                }else{
                    playerCollider.setEnabled(true);
                }
                console.log('isEnabled:',playerCollider.isEnabled());*/
            }
            
        }
    
        
        if(keyEnabledArray[event.keyCode] && event.type === 'keydown') {
            keyEnabledArray[event.keyCode] = false;
            //console.log('keydown:'+event.keyCode+","+keyEnabledArray[event.keyCode])
        }
    
        if( event.type === 'keyup') {
            keyEnabledArray[event.keyCode] = true;
            //console.log('keyup:'+event.keyCode+","+keyEnabledArray[event.keyCode])
        }
    
    });
    
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

    canvas3d.addEventListener('mousemove', function(e)
    {
        //console.log("mousemove:");
        
        if(c_player){

            var ang_ = (e.movementX) * mMouseSenseX * Math.PI/2;
            var ang2_ = (e.movementY) * mMouseSenseY * Math.PI/2;

            /*
            if(camera.zoom==2){
                ang_ *= 0.5;
                ang2_ *= 0.5
            }
            else if(camera.zoom==10){
                ang_ *= 0.5
                ang2_ *= 0.5
            }*/

            //console.log("ang_:"+ang_);
            c_player.angle -= ang_;
            c_player.angle2 -= ang2_;
            c_player.angle2 = Math.max(-Math.PI/2, c_player.angle2);
            c_player.angle2 = Math.min( Math.PI/2, c_player.angle2);
            //console.log("c_player.angle:"+c_player.angle/Math.PI*180);
            //console.log("c_player.angle2:"+c_player.angle2/Math.PI*180);
        }
        
    });


    const gui = new GUI();
    props = {
        showAxes: true,
        showCollision: true,
        //Animation: 0
    };
    gui.add( props, 'showAxes').name('Show axes');
    gui.add( props, 'showCollision').name('Show collision');
    //gui.add( props, 'Animation', { Idle: 0, Forward: 1, Back: 2, Left: 3, Right: 4 } );
    //lastAnimID = 0;


    const clock = new THREE.Clock();
    let delta
    let player_speed = mScale * 5; // [/ms]
    let last_game_time = new Date().getTime(); //[ms]
    let playerLastPosition = new THREE.Vector3(0,0,0)
    let playerNewPosition = new THREE.Vector3(0,0,0)
    let playerMoveDirection = new THREE.Vector3(0,0,0)
    let playerPlaneMoveDistance = new THREE.Vector3(0,0,0)
    let t = 0;
    let lastGroundedTime = performance.now();

    let eventQueue = new RAPIER.EventQueue(true);
    

    tick();
    function tick() {
        stats.begin();

        //const time_world = performance.now() / 1000
        //const dt_world = time_world - lastCallTime
        //lastCallTime = time_world
        let currentTime = performance.now();

        delta = clock.getDelta()
        if (world) {
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
                    let time_now = performance.now();
                    for(var i = 0; i < ArrayPlayerCollider.length; i++){
                        let h = ArrayPlayerCollider[i].handle
                        //if(handle1==playerCollider.handle || handle2==playerCollider.handle){
                        if(handle1==h || handle2==h){
                            //console.log("contact:%o", event.totalForce())
                            if(event.totalForce().y > 1 && time_now > lastJumpTime + 100  ){ // 
                                lastGroundedTime = performance.now();
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

        }

        let current_game_time = new Date().getTime();
        let dt = current_game_time - last_game_time;
        //console.log("dt:"+dt);
        last_game_time = current_game_time;

        t += 1;
          
        if (mAxes != null){
            if(props.showAxes){
                mAxes.visible = true;
            }else{
                mAxes.visible = false;
            }
        }

        if (playerBodyMesh != null){
            if(props.showCollision){
                playerBodyMesh.visible = true;
            }else{
                playerBodyMesh.visible = false;
            }
        }

        
        //const delta = clock.getDelta();
        if ( mixer ) {
            mixer.update( delta );

            //let time_now = performance.now();
        
            let s = playerBody.linvel();
            //console.log("s:", s)
            if(s.y < -10){
                playerBody.setLinvel({ x: s.x, y: -10, z: s.z}, true);
            }


            //console.log("dTime:" + (currentTime - lastGroundedTime) )

            if(currentTime > lastGroundedTime + 20  ){ // Fall
                //console.log("Fall:")
                c_player.isGrounded = false;
                c_player.isOnSlope = false;
                mPlayerIsNotGrounded()
            }

            
            if(c_player.isJump){
                console.log('jump');
                c_player.isGrounded = false;
                c_player.isOnSlope = false;
                mPlayerIsNotGrounded()
                let vx = playerBody.linvel().x;
                let vy = playerBody.linvel().y;
                let vz = playerBody.linvel().z;
                //playerBody.setLinvel({ x: vx, y: 0, z: vz}, true);
                //playerBody.applyImpulse({ x: vx, y: 6, z: vz }, true);
                playerBody.applyImpulse({ x: 0.0, y: 6, z: 0.0 }, true);
                lastJumpTime = performance.now();
                
                c_player.isJump = false;
            }

            if( c_player.isGrounded ){
                mPlayerIsGrounded()
                lastGroundedTime = currentTime
            }

            //console.log("c_player.isGrounded:"+c_player.isGrounded)
            //console.log("currentTime:" + currentTime +" lastGroundedTime:"+lastGroundedTime)

            if( (!movement.forward) && (!movement.back) && (!movement.left) && (!movement.right) ){
                if(!c_player.isCrouch){
                    if(!arrayAction[0].isRunning){
                        //arrayAction[0].play();
                    }
                }else{
                    console.log("crouch")
                    if(arrayAction[0].isRunning){
                        arrayAction[0].stop();
                    }
                    if(!arrayAction[6].isRunning){
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
                arrayAction[2].play();
            }else{
                arrayAction[2].stop();
            }

            if( movement.left && !movement.forward && !movement.back){
                arrayAction[3].play();
            }else{
                arrayAction[3].stop();
            }

            if( movement.right && !movement.forward && !movement.back){
                arrayAction[4].play();
            }else{
                arrayAction[4].stop();
            }   


            
        }

        if (playerMesh != null){
            
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
            if(movement.forward && movement.right){
                c_player.angle_offset = c_player.angle_offset_init + Math.PI/4;
            }else if(movement.forward && movement.left){
                c_player.angle_offset = c_player.angle_offset_init - Math.PI/4;
            }else if(movement.back && movement.right){
                c_player.angle_offset = c_player.angle_offset_init - Math.PI/4;
            }else if(movement.back && movement.left){
                c_player.angle_offset = c_player.angle_offset_init + Math.PI/4;
            }

            playerMesh.rotation.y = c_player.angle - c_player.angle_offset;

            mSetCameraPosition(camera, mCameraOffset, playerMesh);
 
        }
        renderer.render(scene, camera);
        requestAnimationFrame(tick);

        stats.end();
    }
    

    onResize();
    window.addEventListener('resize', onResize);
    function onResize() {
        width = document.getElementById('main_canvas').getBoundingClientRect().width;
        height = document.getElementById('main_canvas').getBoundingClientRect().height;

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        //console.log(width);
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
            ElementRequestPointerLock(canvas3d); //->needs action to enable pointer lock
        }, 1000);
    }
    

}//init