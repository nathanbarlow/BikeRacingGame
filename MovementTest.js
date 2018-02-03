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
var charModelCenterOffset = 140;
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
  friction: 0.0001,
  frictionAir: 0.015,
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
    textureEarth.repeat.set( 8, 8 );
} );

var groundGeometry = new THREE.PlaneGeometry(12000, 12000, 8);
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
camera = new THREE.PerspectiveCamera( 45.0, window.innerWidth / window.innerHeight, 0.1, 50000 );
camera.position.set( character.position.x, 600, -1000 );
var cameraTargetPosition = new THREE.Vector3();
var cameraDelay = 50;

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

	//KEY INPUT
  if((keys[KEY_S])){
      let localForceX = 0;
      let localForceY = (+0.001 * character.mass);

			//Figures out what local forc needs to be on vehicle
			let globalForce = globalXYFromLocalXY(localForceX, localForceY, character);

      Matter.Body.applyForce(character,character.position,{
        x:globalForce.x,
        y:globalForce.y
      });
			//charMesh.rotation.z = degToRad(10);
  }

	if((keys[KEY_W])){
      let localForceX = 0;
      let localForceY = (-0.007 * character.mass);

			//Figures out what local forc needs to be on vehicle
			let globalForce = globalXYFromLocalXY(localForceX, localForceY, character);

      Matter.Body.applyForce(character,character.position,{
        x:globalForce.x,
        y:globalForce.y
      });
  }

  if((keys[KEY_A])){
      let force = (-0.0019 * character.mass);
      // Matter.Body.rotate(character, -0.04,);
      Matter.Body.setAngularVelocity(character, -0.025);

			//Rotate bike to lean in to turn
			playerTurning = true;
  }

  if((keys[KEY_D])){
      let force = (+0.0019 * character.mass);
      // Matter.Body.rotate(character, +0.04,);
      Matter.Body.setAngularVelocity(character, +0.025);

			//Rotate bike to lean in to turn
			playerTurning = true;
  }
	//Update the lean of the bike
	bikeLeanHandler();

	//Rotate Wheel based on character objects velocity
	wheelRotationHandler();

	//Turn Sideways velocity into forward velocity/Kill sideways velocity
	var charVelocity = getObjectsLocalVelocity(character);
	//check x axis velocity
	if(Math.abs(charVelocity.x) >= 0.05){
		//Kill x axis velocity
		let globalVel = globalXYFromLocalXY(0, charVelocity.y, character);
		Matter.Body.setVelocity(character, globalVel);
	}

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

	renderCount += 1;
	if (renderCount >= 60){
	  renderCount = 0;
	};

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

function globalXYFromLocalXY(forceX, forceY, inputBody){
	//input x and y desired local force and matter.js body to act on
	//return a vector2 for Global forces to make that happen
	var globalX = forceX * Math.cos(inputBody.angle) - forceY * Math.sin(inputBody.angle);
	var globalY = forceX * Math.sin(inputBody.angle) + forceY * Math.cos(inputBody.angle);

	return {x:globalX, y:globalY};
}

function bikeLeanHandler() {
	var rotationFactor = 0.015;
	var resetFactor = 1;
	//BIKE Lean handler
	if(playerTurning == true){
		if(character.angularVelocity > 0.015 ){
			if(charModel.rotation.z > degToRad(-35)){
				charModel.rotateZ(degToRad(- character.speed * rotationFactor));
			}
		}
		if(character.angularVelocity < -0.015 ){
			if(charModel.rotation.z < degToRad(35)){
				charModel.rotateZ(degToRad(+ character.speed * rotationFactor));
			}
		}
	}

	//Reset bike lean orientation if not turning
	if(playerTurning == false || character.speed <= 40){
		if(charModel.rotation.z > degToRad(1)){
			charModel.rotateZ(degToRad(-resetFactor));

		} else if (charModel.rotation.z < degToRad(-1)){
			charModel.rotateZ(degToRad(+resetFactor));

		} else {
			charModel.rotation.z = 0;
		}
	}
	//Reset playerTurning variable
	playerTurning = false;
}

function wheelRotationHandler() {
	speedFactor = 0.09;

	vel = getObjectsLocalVelocity(character);
	if(vel.y < 0){
		speedFactor *= -1;
	} else {
		speedFactor *= 1;
	}
	charMeshWheel.rotateX(degToRad(character.speed * speedFactor));
}
