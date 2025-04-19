import { GUI } from '/mTPS-game-sample/lib/lil-gui.module.min.js';

window.addEventListener('DOMContentLoaded', init);
function init() {

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const canvas3d = document.querySelector( '#canvas' );
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas3d, //document.querySelector('#canvas')
        antialias: true
    });
    //const main_canvas = document.querySelector( '#main_canvas' );
    let width = document.getElementById('main_canvas').getBoundingClientRect().width;
    let height = document.getElementById('main_canvas').getBoundingClientRect().height;
    //let width = window.innerWidth;
    //let height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color('darkblue')); //'gray'
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    console.log(window.devicePixelRatio);
    console.log(width+", "+height);
 
    const scene = new THREE.Scene();
 
    //let model_scale = 1000;
    let camera = new THREE.PerspectiveCamera(80, width / height, 1, 50000);
    //camera.position.set(model_scale*0.1, model_scale*1.2, model_scale*1.5);
    
    function mSetCameraPosition(camera, model){
        let p = model.position;
        //let dx = model_scale*0.1;
        //let dy = model_scale*1.4;
        //let dz = model_scale*1.6;
        let dx = 1000*0.1;
        let dy = 1000*1.4;
        let dz = 1000*1.6;
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
    const url = '/mTPS-game-sample/model/no0.glb';
    
    let playerMesh = new THREE.Group();
    //playerMesh.castShadow = true;
    //playerMesh.receiveShadow = true;

    let model = null;
    let mAxes = null;
    
    let mixer;
    let props, lastAnimID;
    let arrayAction = new Array(5); //[];
    let mAnimOrder = {Idle:0, RunForward:1, RunBack:2, RunLeft:3, RunRight:4 };
    let model_scale = 10;
    const loader = new THREE.FBXLoader();
    loader.load( 'model/mSet5.fbx', function ( object ) {

        mixer = new THREE.AnimationMixer( object );
        console.log("object.animations.length:"+object.animations.length)
        for(var i = 0; i<object.animations.length; i++){
            console.log("%o", object.animations[ i ]);
            //arrayAction.push( mixer.clipAction(object.animations[ i ]) );
            arrayAction[ mAnimOrder[object.animations[i].name] ] = mixer.clipAction(object.animations[ i ]);
        }
        arrayAction[0].play();

        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        //--- Axis ---//
        const size = 1000*0.1;
        mAxes = new THREE.AxesHelper(size);
        mAxes.position.x =  0;
        mAxes.position.y = 10; 
        playerMesh.add(mAxes);

        //object.position.set(0, 0, 0);
        //scene.add( object );

        object.scale.set(model_scale, model_scale, model_scale);
        playerMesh.add(object);
        scene.add( playerMesh );

        mSetCameraPosition(camera, playerMesh);
    } );

    //renderer.gammaOutput = true;
    //renderer.gammaFactor = 2.2;

    //--- Axis ---//
    /*const size = model_scale*0.1;
    let mAxes = new THREE.AxesHelper(size);
    mAxes.position.x =  0;
    mAxes.position.y = 10; //model_scale;
    //console.log("mAxes:%o", mAxes);
    scene.add(mAxes);*/

    //--- Grid ---//
    let grid_size = 5000;
    let grid_num = 10;
    const grid = new THREE.GridHelper( grid_size*grid_num*2, grid_num*2, 0x000000, 0x000000 );
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    scene.add( grid );

    //--- Plane ---//
    /*const geometry = new THREE.PlaneGeometry( grid_size*grid_num*2, grid_size*grid_num*2 );
    const material = new THREE.MeshBasicMaterial( {color: "grey", side: THREE.DoubleSide} );
    const plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = Math.PI/2;
    plane.receiveShadow = true;
    scene.add( plane );*/

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( grid_size*grid_num*2, grid_size*grid_num*2 ), new THREE.MeshPhongMaterial( { color: 'gray', depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    const boxGeometry = new THREE.BoxGeometry( 100, 100, 100);
    const boxMesh = new THREE.Mesh(
        boxGeometry,
        new THREE.MeshStandardMaterial()
    )
    boxMesh.position.set(0, 2000, 0)
    scene.add(boxMesh)


    //--- Light ---//
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(0, 2000, 1000);
    light.intensity = 2; 
    light.castShadow = true;
    /*light.shadow.camera.top = 1000;
    light.shadow.camera.bottom = - 1000;
    light.shadow.camera.left = - 1000;
    light.shadow.camera.right = 1000;*/
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 10000
    scene.add(light);
    /*const light = new THREE.SpotLight(0xffffff, 400, 100, Math.PI / 4, 1);
    light.castShadow = true;
    scene.add(light);*/



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
    $(document).on( 'keydown keyup', (event) => {  

        
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

    canvas3d.addEventListener('mousemove', function(e)
    {
        //console.log("mousemove:");
        
        if(c_player){

            var ang_ = (e.movementX) * mMouseSenseX * Math.PI/2;
            var ang2_ = (e.movementY) * mMouseSenseY * Math.PI/2;
            //console.log("ang_:"+ang_);
            c_player.angle -= ang_;
            c_player.angle2 -= ang2_;
            c_player.angle2 = Math.max(-Math.PI/2, c_player.angle2);
            c_player.angle2 = Math.min( Math.PI/2, c_player.angle2);
            //console.log("c_player.angle:"+c_player.angle/Math.PI*180);
            //console.log("c_player.angle2:"+c_player.angle2/Math.PI*180);

            /*
            if(camera.zoom==2){
                ang_ *= mInputTergetSens/100;
                ang2_ *= mInputTergetSens/100
            }
            else if(camera.zoom==10){
                ang_ *= mInputSniperSens/100;
                ang2_ *= mInputSniperSens/100
            }*/

        }
        
    });

    //Pointer lock
    //const canvas2d = document.querySelector( '#canvas-2d' );
    //let canvas2d = $('#canvas-2d')[0];
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

    const gui = new GUI();
    props = {
        showAxes: true,
        //Animation: 0
    };
    gui.add( props, 'showAxes').name('Show axes');
    //gui.add( props, 'Animation', { Idle: 0, Forward: 1, Back: 2, Left: 3, Right: 4 } );
    //lastAnimID = 0;

    
    const clock = new THREE.Clock();
    let player_speed = 5; // [/ms]
    let last_game_time = new Date().getTime(); //[ms]
    let t = 0;
    tick();
    function tick() {
        stats.begin();

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

        const delta = clock.getDelta();
        if ( mixer ) {
            mixer.update( delta );

            if( (!movement.forward) && (!movement.back) && (!movement.left) && (!movement.right) ){
                arrayAction[0].play();
            }else{
                arrayAction[0].stop();
            }

            if(movement.forward){
                arrayAction[1].play();
            }else{
                arrayAction[1].stop();
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
            if(move_num == 2){
                dis /= Math.sqrt(2);
            }
            let a1 = c_player.angle;
            if(movement.forward){
                playerMesh.position.z -= dis * Math.cos(a1);
                playerMesh.position.x -= dis * Math.sin(a1);
            }
            if(movement.back){
                playerMesh.position.z += dis * Math.cos(a1);
                playerMesh.position.x += dis * Math.sin(a1);
            }
            if(movement.left){
                playerMesh.position.x -= dis * Math.cos(a1);
                playerMesh.position.z += dis * Math.sin(a1);
            }
            if(movement.right){
                playerMesh.position.x += dis * Math.cos(a1);
                playerMesh.position.z -= dis * Math.sin(a1);
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

            mSetCameraPosition(camera, playerMesh);

            
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


}//init