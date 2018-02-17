var renderCount = 0;
var speedFactor;
var playerTurning = false;
var rotObjectMatrix;
var terrainCollisionCreation = false;
var collisionVerticesGroups = [];

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

// create renderer
var render2D = Matter.Render.create({
    element: document.getElementById('physicsCanvas'),
    engine: engine,
    options: {
        width: 300,
        height: 300,
				wireframes: false
    }
});

Matter.Render.run(render2D);

// create runner
var runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);


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

//PARTICLES
var particles = new THREE.Geometry();

//add particles to geometry
for (var p = 0; p < 500; p++){
	// (3600, -78, 471); player.collision start position
	var particle = new THREE.Vector3(Math.random()*50 + 3600, Math.random()*300, Math.random()*50 + 500);
	particles.vertices.push(particle);
}
var smokeTexture = THREE.ImageUtils.loadTexture('smoke.png');

var smokeMaterial = new THREE.ParticleBasicMaterial({
	map: smokeTexture,
	transparent: true,
	blending: THREE.AdditiveBlending,
	size: 50,
	color: 0x111111
});

var particleMaterial = new THREE.ParticleBasicMaterial({ color: 0xeeeeee, size: 5 });

var particleSystem = new THREE.ParticleSystem(particles, smokeMaterial);

scene.add(particleSystem);



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

//BLENDER RACETRACK
var loader = new THREE.ObjectLoader(); //used for all blender model imports
var raceTrackMesh = new THREE.Mesh();
var raceGroundMesh = new THREE.Mesh();
var raceMeshGroup = new THREE.Group();
var raceTrackCollision = new THREE.Group();
// var collisionMesh = new THREE.Mesh();

var textureLava = new THREE.TextureLoader().load( 'lava.png', function ( textureLava ) {
		textureLava.wrapS = textureLava.wrapT = THREE.RepeatWrapping;
} );
var matLava = new THREE.MeshLambertMaterial({
	map: textureLava,
});

loader.load('RaceTrack1.json', handle_load_racetrack);
function handle_load_racetrack(loadObject) {

	//setup materials
	let textureWall = new THREE.TextureLoader().load( 'canyonwall1.jpg', function ( textureWall ) {
	    textureWall.wrapS = textureWall.wrapT = THREE.RepeatWrapping;
	} );
	let matCanyonWall = new THREE.MeshLambertMaterial({
		map: textureWall,
	});

	let textureCanyon = new THREE.TextureLoader().load( 'canyon2.jpg', function ( textureCanyon ) {
	    textureCanyon.wrapS = textureCanyon.wrapT = THREE.RepeatWrapping;
	} );
	let matCanyon = new THREE.MeshLambertMaterial({
		map: textureCanyon,
	});

	let textureGround = new THREE.TextureLoader().load( 'DirtRoad.jpg', function ( textureGround ) {
	    textureGround.wrapS = textureGround.wrapT = THREE.RepeatWrapping;
	} );
	let matGround = new THREE.MeshLambertMaterial({
		map: textureGround,
	});

	let collisionMat = new THREE.MeshLambertMaterial({
		color: 0x66ff33,
	});

	//LOAD RACETRACK WALLS AND COLLISION MESH
	loadObject.traverse(function(child){
		let objName = String(child.name).slice(0,9);

		if(child.name == "walls"){
			//assign wall geometry to raceTrackMesh.geometry
			raceTrackMesh.geometry = child.geometry;
			raceTrackMesh.material = matCanyonWall;
			raceMeshGroup.add(raceTrackMesh);

		} else if(objName == "Mountains"){
			var mountainMesh = new THREE.Mesh();
			mountainMesh.geometry = child.geometry;
			mountainMesh.material = matCanyon;
			raceMeshGroup.add(mountainMesh);

		} else if(objName == "GroundObj"){
			raceGroundMesh.geometry = child.geometry;
			raceGroundMesh.material = matGround;
			raceMeshGroup.add(raceGroundMesh);

		} else if(objName == "LavaFalls"){
			var lavaMesh = new THREE.Mesh();
			lavaMesh.geometry = child.geometry;
			lavaMesh.material = matLava;
			raceMeshGroup.add(lavaMesh);

		} else if(objName == "canyonObj"){
			var canyonMesh = new THREE.Mesh();
			canyonMesh.geometry = child.geometry;
			canyonMesh.material = matCanyon;
			raceMeshGroup.add(canyonMesh);

		} else if(objName == "collision"){
			var collisionMesh = new THREE.Mesh();
			collisionMesh.geometry = child.geometry;

			//rotate, scale, set position, and apply material
			collisionMesh.material = collisionMat;
			collisionMesh.rotation.set(degToRad(-90),0,0);
			// collisionMesh.scale.set(3000, 3000, 3000);
			collisionMesh.position.set(0, -250, 0);

			//add mesh to scene
			raceTrackCollision.add(collisionMesh);

			var vertAverage = {x: 0, y: 0};

			//Get an array of all verticies for this object
			var vertArray = [];
			for(i = 0; i < collisionMesh.geometry.vertices.length; i++) {
				// console.log(collisionMesh.geometry.vertices[i]);
				var vert = collisionMesh.geometry.vertices[i];
				vertArray.push(Matter.Vector.create(vert.x, -vert.y));

				vertAverage.x += vert.x;
				vertAverage.y -= vert.y;
			}

			//get vertArrayCentre
			vertAverage.x = vertAverage.x / vertArray.length;
			vertAverage.y = vertAverage.y / vertArray.length;

			//create Mater object
			collisionObj = Matter.Bodies.fromVertices(vertAverage.x, vertAverage.y, vertArray, { isStatic: true });
			Matter.World.add(engine.world, collisionObj);
		}
	});


	raceMeshGroup.rotation.set(degToRad(-90),0,0);
	raceMeshGroup.position.set(0, -250, 0);

	scene.add(raceMeshGroup);
	// scene.add(raceTrackCollision);
}

var player = {
	globalLevel	: new THREE.Group(),
	localLevel	: new THREE.Group(),
	seat				: new THREE.Mesh(),
	wheel				: new THREE.Mesh(),
	texture			: new THREE.TextureLoader().load('Bike.png'),
	collision		: "set up in player.init",
	speedTurnInfluence: function(){return 0.0000008 * player.collision.speed},
	turnResponsiveness: function(){return 0.0007 - player.speedTurnInfluence()},
	maxTurn						: 0.025,

	sync: function(){
		player.globalLevel.position.x = player.collision.position.x;
	  player.globalLevel.position.z = player.collision.position.y;
	  player.globalLevel.rotation.y = -player.collision.angle;
	},

	turnLeft: function(){
		let velocity = Math.max(player.collision.angularVelocity - player.turnResponsiveness(), -player.maxTurn);
		Matter.Body.setAngularVelocity(player.collision, velocity);

		//Rotate bike to lean in to turn
		playerTurning = true;
	},

	turnRight: function(){
		let velocity = Math.min(player.collision.angularVelocity + player.turnResponsiveness(), player.maxTurn);
		Matter.Body.setAngularVelocity(player.collision, velocity);

		//Rotate bike to lean in to turn
		playerTurning = true;
	},

	moveForward: function(){
		let localForceX = 0;
		let localForceY = (-0.007 * player.collision.mass);

		//Figures out what local forc needs to be on vehicle
		let globalForce = globalXYFromLocalXY(localForceX, localForceY, player.collision);

		Matter.Body.applyForce(player.collision,player.collision.position,{
			x:globalForce.x,
			y:globalForce.y
		});
	},

	moveBackward: function(){
		let localForceX = 0;
		let localForceY = (+0.001 * player.collision.mass);

		//Figures out what local forc needs to be on vehicle
		let globalForce = globalXYFromLocalXY(localForceX, localForceY, player.collision);

		Matter.Body.applyForce(player.collision,player.collision.position,{
			x:globalForce.x,
			y:globalForce.y
		});
	},

	LeanHandler: function(){
		var rotationFactor = 35; //degrees
		var maxAngularVelocity = 0.025;
		var maxPossibleRotation = degToRad(35); //radions

		//BIKE Lean handler
		player.localLevel.rotation.z = degToRad(-player.collision.angularVelocity * rotationFactor / maxAngularVelocity);

		if (player.localLevel.rotation.z > maxPossibleRotation) {
			player.localLevel.rotation.z = maxPossibleRotation;
		}

		if (player.localLevel.rotation.z < -maxPossibleRotation) {
			player.localLevel.rotation.z = -maxPossibleRotation;
		}

		//Reset playerTurning variable
		playerTurning = false;
	},

	wheelRotationHandler: function() {
		speedFactor = 0.09;

		vel = getObjectsLocalVelocity(player.collision);
		if(vel.y < 0){
			speedFactor *= -1;
		} else {
			speedFactor *= 1;
		}
		player.wheel.rotateX(degToRad(player.collision.speed * speedFactor));
	},

	init: function(){
		//BLENDER MODEL BIKE LOAD
		//OBJECT Hierarchy: player.globalLevel( player.localLevel( player.wheel, player.seat ) )
		var loader = new THREE.JSONLoader(); //used for all blender model imports
		//load Seat
		loader.load('BikeSeat.json', handle_load_seat);

		function handle_load_seat(loadObject) {
			player.seat.geometry = loadObject;
			let mat = new THREE.MeshLambertMaterial({
				map: player.texture,
			});
			player.seat.material = mat;
			player.seat.scale.set(50, 50, 50);
		}

		//load Wheel
		loader.load('BikeWheel.json', handle_load_wheel)
		function handle_load_wheel(loadObject) {
			player.wheel.geometry = loadObject;
			let mat = new THREE.MeshLambertMaterial({
				map: player.texture,
			});
			player.wheel.material = mat;
			player.wheel.scale.set(50, 50, 50);
		}

		//set player.localLevel rotation offset
		//(allows bike to lean left and right and rotate arround bottom of tire)
		var charModelCenterOffset = 140;
		player.wheel.position.y = charModelCenterOffset;
		player.seat.position.y = charModelCenterOffset;
		player.localLevel.position.y = -charModelCenterOffset;

		//Set position of Bike in world
		player.globalLevel.position.set(3600, -78, 471); //0, -200, -500

		//Setup Group Hierarchy and add to scene
		player.localLevel.add( player.seat );
		player.localLevel.add( player.wheel );
		player.globalLevel.add( player.localLevel );
		scene.add( player.globalLevel );

		//Set up player collision with Matter.js
		player.collision = Matter.Bodies.rectangle(player.globalLevel.position.x, player.globalLevel.position.z, 130, 440, {
			friction: 0.0001,
			frictionAir: 0.012,
			mass: 500,
		});
	}
};

player.init();


//ADD STATIC OBJECT
var baseGeometry = new THREE.BoxGeometry(1000, 100, 100);
var baseMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
});

var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
baseMesh.position.set(-700, -200, 0);
scene.add( baseMesh );

var boxB = Matter.Bodies.rectangle(baseMesh.position.x, baseMesh.position.z, 1000, 100,{ isStatic: true });


//ADD STATIC OBJECT_2
var baseMesh2 = new THREE.Mesh(baseGeometry, baseMaterial);
baseMesh2.position.set(0, -200, 400);
scene.add( baseMesh2 );

var boxC = Matter.Bodies.rectangle(baseMesh2.position.x, baseMesh2.position.z, 1000, 100,{ isStatic: true });


//CAMERA
camera = new THREE.PerspectiveCamera( 45.0, window.innerWidth / window.innerHeight, 0.1, 50000 );
camera.position.set( player.collision.position.x, 600, -1000 );
var cameraTargetPosition = new THREE.Vector3();
var cameraDelay = 10;


//ADD MOVEMENT CONTROLS
// controls = new THREE.OrbitControls( camera );
// controls.target.set( player.globalLevel.position.x, player.globalLevel.position.y, player.globalLevel.position.z);
// controls.update();
// controls.enabled = true;


//ADD ALL PHYSICS BODIES TO WORLD
Matter.World.add(engine.world, [
	boxA,
	boxB,
	boxC,
	player.collision,
	]);


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
	//once world has been rendered grab verticies and run collisionCreation once
	if(terrainCollisionCreation == false){
		collisionCreation();
	}

	var viewZoom = 8000;
	Matter.Render.lookAt(render2D, {
	        min: { x: player.collision.position.x - viewZoom, y: player.collision.position.y - viewZoom },
	        max: { x: player.collision.position.x + viewZoom, y: player.collision.position.y + viewZoom }
	    });
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

  player.sync();

	//KEY INPUT
  if((keys[KEY_S])){
			player.moveBackward();
  }

	if((keys[KEY_W])){
		player.moveForward();
  }

  if((keys[KEY_A])){
  	player.turnLeft();
  }

  if((keys[KEY_D])){
		player.turnRight();
  }

	//Update the lean of the bike
	player.LeanHandler();

	//Rotate Wheel based on player.collision objects velocity
	player.wheelRotationHandler();

	//Update Lava Material
	textureLava.offset.y += 0.0005;

	//Turn Sideways velocity into forward velocity/Kill sideways velocity
	var charVelocity = getObjectsLocalVelocity(player.collision);
	//check x axis velocity
	if(Math.abs(charVelocity.x) >= 0.1){
		//Kill x axis velocity
		let globalVel = globalXYFromLocalXY(0, charVelocity.y, player.collision);
		Matter.Body.setVelocity(player.collision, globalVel);
	}

  //Update Camera position with delay
	cameraTargetPosition.set(
		player.globalLevel.position.x + cameraRelative.x * Math.cos(player.collision.angle) - cameraRelative.z * Math.sin(player.collision.angle),
    cameraRelative.y,
    player.globalLevel.position.z + cameraRelative.x * Math.sin(player.collision.angle) + cameraRelative.z * Math.cos(player.collision.angle)
	);

	if (camera.position.distanceTo(cameraTargetPosition) >= cameraDelay) {
		camera.position.lerp(cameraTargetPosition, 0.1);
	}

  camera.lookAt( player.globalLevel.position );

	//UPDATE DISPLAYED INFO
	updateSpeedometer();

  //Render scene
	renderer.render(scene, camera);

	//Run Render
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

function updateSpeedometer(){
	renderCount += 1;
	if (renderCount >= 30){
		document.getElementById("speedometer").innerHTML = player.collision.speed.toFixed(0);
		renderCount = 0;
	};
}

function collisionCreation() {
	//Matter.Bodies.fromVertices(x, y, [[vector]],

}
