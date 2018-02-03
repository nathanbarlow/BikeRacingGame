var renderCount = 0;
var speedFactor;
var playerTurning = false;
var rotObjectMatrix;

const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
var keys = [];

cameraRelative = new THREE.Vector3 (0, 600, 2000);

//RENDERER
var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas'), antialias: true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor('black');

//SCENE
scene = new THREE.Scene();

//ADD PHYSICS ENGINE
var engine = Matter.Engine.create();

//LIGHTING
var light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

var light1 = new THREE.PointLight(0xffffff, 0.8);
scene.add(light1);
light1.position.set(500, 200, -500);

var light2 = new THREE.PointLight(0xffffff, 0.5);
scene.add(light2);
light2.position.set(-500, 200, -500);

//SKYBOX
var textureCube = new THREE.CubeTextureLoader()
		.setPath( 'skybox/')
		.load( [ 'morning_ft.jpg', 'morning_bk.jpg', 'morning_up.jpg', 'morning_dn.jpg', 'morning_rt.jpg', 'morning_lf.jpg' ] );
scene.background = textureCube;


//GO BOARD BASE
var boardZ = 500;
var boardX = boardZ;
var boardY = 100;
var boardGeometry = new THREE.BoxGeometry(boardX, boardY, boardZ);
var boardMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
	envMap: textureCube,
	combine: THREE.MixOperation,
	reflectivity: 0.4,
	map: new THREE.TextureLoader().load('marbel.jpg'),
	//bumpMap: new THREE.TextureLoader().load('marbel.jpg'),
	//bumpScale: 1,
});
var boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
boardMesh.position.set(0, -200, -500);
scene.add( boardMesh );

//make physics repersentation of board
var boxA = Matter.Bodies.rectangle(boardMesh.position.x, boardMesh.position.z, boardX, boardZ);

//BLENDER MODEL LOAD
//OBJECT Hierarchy: charMesh( charModel( charMeshWheel, charMeshSeat ) )

var charMesh = new THREE.Group();
var charModel = new THREE.Group();
var charMeshSeat = new THREE.Mesh();
var charMeshWheel = new THREE.Mesh();
var bikeTexture = new THREE.TextureLoader().load('Bike.png');

//load Seat
var loader = new THREE.JSONLoader();
loader.load('BikeSeat.json', handle_load_seat);
var thing;
function handle_load_seat(loadObject) {
	charMeshSeat.geometry = loadObject;
	var mat = new THREE.MeshLambertMaterial({
		map: bikeTexture,
	});
	charMeshSeat.material = mat;
	charMeshSeat.scale.set(50, 50, 50);
}

//load Wheel
loader.load('BikeWheel.json', handle_load_wheel)
function handle_load_wheel(loadObject) {
	charMeshWheel.geometry = loadObject;
	var mat = new THREE.MeshLambertMaterial({
		map: bikeTexture,
	});
	charMeshWheel.material = mat;
	charMeshWheel.scale.set(50, 50, 50);
}

//set charModel rotation offset
//(allows bike to lean left and right and rotate arround bottom of tire)
var charModelCenterOffset = 165;
charMeshWheel.position.y = charModelCenterOffset;
charMeshSeat.position.y = charModelCenterOffset;
charModel.position.y = -charModelCenterOffset;

//Set position of Bike in world
charMesh.position.set(-50, -78, -1700);

//Setup Group Hierarchy and add to scene
charModel.add( charMeshSeat );
charModel.add( charMeshWheel );
charMesh.add( charModel );
scene.add( charMesh );


var character = Matter.Bodies.rectangle(charMesh.position.x, charMesh.position.z, 130, 440, {
  friction: 0.001,
  frictionAir: 0.04,
});


//ADD STATIC FLOOR
var baseGeometry = new THREE.BoxGeometry(1000, 100, 100);
var baseMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
});

var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
baseMesh.position.set(-700, -200, 0);
scene.add( baseMesh );

var boxB = Matter.Bodies.rectangle(baseMesh.position.x, baseMesh.position.z, 1000, 100,{ isStatic: true });

//ADD EARTH GROUND
var textureEarth = new THREE.TextureLoader().load( 'ground.jpg', function ( textureEarth ) {
    textureEarth.wrapS = textureEarth.wrapT = THREE.RepeatWrapping;
    textureEarth.offset.set( 0, 0 );
    textureEarth.repeat.set( 4, 4 );
} );

var groundGeometry = new THREE.PlaneGeometry(6000, 6000, 4);
var groundMaterial = new THREE.MeshLambertMaterial({
	map: textureEarth,
	// side: THREE.DoubleSide,
});

var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.set(0, -250, 0);
groundMesh.rotation.x = (degToRad(-90));
scene.add( groundMesh );

//ADD STATIC FLOOR2
var baseMesh2 = new THREE.Mesh(baseGeometry, baseMaterial);
baseMesh2.position.set(0, -200, 400);
scene.add( baseMesh2 );

var boxC = Matter.Bodies.rectangle(baseMesh2.position.x, baseMesh2.position.z, 1000, 100,{ isStatic: true });

//CAMERA
camera = new THREE.PerspectiveCamera( 45.0, window.innerWidth / window.innerHeight, 0.1, 10000 );
camera.position.set( character.position.x, 600, -1000 );
var cameraTargetPosition = new THREE.Vector3();
var cameraDelay = 75;

//ADD MOVEMENT CONTROLS
// controls = new THREE.OrbitControls( camera );
// controls.target.set( charMesh.position.x, charMesh.position.y, charMesh.position.z);
// controls.update();
// controls.enabled = true;

//ADD ALL PHYSICS BODIES TO WORLD
Matter.World.add(engine.world, [boxA, boxB, boxC, character]);

//ADJUST GRAVITY
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

//RUN THE PHYSICS ENGINE
Matter.Engine.run(engine);

//ADD EVENT LISTENER
// document.addEventListener( 'keydown', characterControls, false );
document.body.addEventListener("keyup", function(e) {
  keys[e.keyCode] = false;
});
document.body.addEventListener("keydown", function(e) {
  keys[e.keyCode] = true;
});

//RENDER LOOP
requestAnimationFrame(render);

function render() {
  //write the cameras position to the console every 30 frames
  // frameCount += 1
  // if (frameCount == 30) {
  //   console.log(camera.position);
  //   frameCount = 0;
  // }

  //Update location of objects
  boardMesh.position.x = boxA.position.x;
  boardMesh.position.z = boxA.position.y;
  boardMesh.rotation.y = -boxA.angle;

  baseMesh.position.x = boxB.position.x;
  baseMesh.position.z = boxB.position.y;

  baseMesh2.position.x = boxC.position.x;
  baseMesh2.position.z = boxC.position.y;

  charMesh.position.x = character.position.x;
  charMesh.position.z = character.position.y;
  charMesh.rotation.y = -character.angle;

  // react to key commands and apply force as needed
  // x′=xcosθ−ysinθ
  // y′=xsinθ+ycosθ

	//RESET PLAYERS TILT ANGLE
	//charMesh.rotation.z = 0;

	//set position to Vector3
	//rotateObject using matrix
	//set position back to recorded Vector3




	//KEY INPUT
  if((keys[KEY_S])){
      let force = (+0.01 * character.mass);
      var localForceX = 0;
      var localForceY = force;
      Matter.Body.applyForce(character,character.position,{
        x:localForceX * Math.cos(character.angle) - localForceY * Math.sin(character.angle),
        y:localForceX * Math.sin(character.angle) + localForceY * Math.cos(character.angle)
      });
			//charMesh.rotation.z = degToRad(10);
  }

	if((keys[KEY_W])){
      let force = (-0.02 * character.mass);
      var localForceX = 0;
      var localForceY = force;

			//Figures out what local forc needs to be on vehicle
      Matter.Body.applyForce(character,character.position,{
        x:localForceX * Math.cos(character.angle) - localForceY * Math.sin(character.angle),
        y:localForceX * Math.sin(character.angle) + localForceY * Math.cos(character.angle)
      });
  }

  if((keys[KEY_A])){
      let force = (-0.0019 * character.mass);
      // Matter.Body.rotate(character, -0.04,);
      Matter.Body.setAngularVelocity(character, -0.025);

			//Rotate bike to lean in to turn
			playerTurning = true;
			if(charModel.rotation.z < degToRad(35)){
				charModel.rotateZ(degToRad(+character.speed*.02));
			}
			// rotateAroundObjectAxis(charModel, new THREE.Vector3(0,0,1), degToRad(10));
  }

  if((keys[KEY_D])){
      let force = (+0.0019 * character.mass);
      // Matter.Body.rotate(character, +0.04,);
      Matter.Body.setAngularVelocity(character, +0.025);

			//Rotate bike to lean in to turn
			playerTurning = true;
			if(charModel.rotation.z > degToRad(-35)){
				charModel.rotateZ(degToRad(-character.speed*.02));
			}
  }

	//Reset bike lean orientation if not turning
	if(playerTurning == false || character.speed <= 25){
		if(charModel.rotation.z > degToRad(1)){
			charModel.rotateZ(degToRad(-2));

		} else if (charModel.rotation.z < degToRad(-1)){
			charModel.rotateZ(degToRad(2));

		} else {
			charModel.rotation.z = 0;
		}
	}
	playerTurning = false;

  // renderCount += 1;
  // if (renderCount >= 60){
  //   // console.log(character.velocity);
  //   renderCount = 0;
  // };

	//Rotate Wheel based on character objects velocity
	speedFactor = -0.09;
	charMeshWheel.rotateX(degToRad(character.speed * speedFactor));

	//Turn Sideways velocity into forward velocity
	//TODO: do this thing see video

  //Update Camera position with delay
	cameraTargetPosition.set(
		charMesh.position.x + cameraRelative.x * Math.cos(character.angle) - cameraRelative.z * Math.sin(character.angle),
    cameraRelative.y,
    charMesh.position.z + cameraRelative.x * Math.sin(character.angle) + cameraRelative.z * Math.cos(character.angle)
	);

	if (camera.position.distanceTo(cameraTargetPosition) >= cameraDelay) {
		camera.position.lerp(cameraTargetPosition, 0.07);
	}

  camera.lookAt( charMesh.position );

  //Render scene
	renderer.render(scene, camera);
  requestAnimationFrame(render);

}

function degToRad (numb) {
  return numb * Math.PI / 180
}

function getObjectsLocalVelocity(inputBody) {
	//INPUT a matter.js object
	//OUTPUT objects local x and y velocities

	//get local y velocity
	var yVelocity = inputBody.velocity.y * Math.cos(inputBody.angle) - inputBody.velocity.x * Math.sin(inputBody.angle);
	//get local x velocity
	var xVelocity = inputBody.velocity.y * Math.sin(inputBody.angle) + inputBody.velocity.x * Math.cos(inputBody.angle);

	var returnValue = {x:xVelocity, y:yVelocity};
	return returnValue;
}

function globalForceFromLocalForce(forceX, forceY, inputBody){
	//input x and y desired local force and matter.js body to act on
	//return a vector2 for Global forces to make that happen
	var globalX = forceX * Math.cos(inputBody.angle) - forceY * Math.sin(inputBody.angle);
	var globalY = forceX * Math.sin(inputBody.angle) + forceY * Math.cos(inputBody.angle);

	return {x:globalX, y:globalY};
}
