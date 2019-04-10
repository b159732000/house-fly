/*----------------------------
- 宣告變數
- 設定WebGL Render
- 加入相機
- 加入直射光
- 載入相機控制器 (Orbitcontrol)
- 讀取FBX模型
- 加入場景背景 (CubeMap)
- 滑鼠事件監聽器               [複製自view-360-panarama]
    - 基本滑鼠動作
    - Is mouse moving? (檢測滑鼠是否正在移動及移動速度)
- 視窗大小調整事件監聽器        [複製自view-360-panarama]
- 主要相機控制模組
    - 渲染器                  [複製自view-360-panarama]
    - 主動畫animate()         [複製自view-360-panarama]
    - 畫面摩擦力 (Friction)
    - 按照滑鼠點擊位置，設定camera視線中心點的x和y
    - 計算滑鼠點擊與平面交界 (Raycaster)
    - 滑鼠點擊地面的視覺回饋
    - 滑鼠在地面上移動視覺回饋
- 除錯輔助工具
    - HTML按鈕
        - 按一下增加減少相機視線中心x、y、z軸10，並更新注視點紅球位置
        - 切換相機到指定位置
        - 控制相機注視的點，每按一下按鈕該軸向+10
        - 移除場景中最後一個新增的物件
        - 輸出相機log
        - 在相機注視原始點生成黑球
    - 變換選取到的物件的material
    - 在相機注視點生成紅球
------------------------------*/


//宣告變數
//主相機控制模組與addeventlistener的變數
var element = document.getElementById('demo'),
    onPointerDownLat,
    onPointerDownLon,
    fov = 70,
    screen = {
        lat: 1.34,
        lon: 231.51
    },
    // lat = 0,
    // lon = 90,
    onMouseDownLon = 0,
    onMouseDownLat = 0,
    //camera注視點中心
    // width = window.innerWidth,
    // height = window.innerHeight,
    // ratio = width / height,
    cameraPosition = {
        x: -149,
        y: 54,
        z: -416
    },
    toggle = 0,
    sphere,
    spheres = [],
    spheresIndex = 0;
//畫面摩擦力
var prevLon = screen.lon,
    prevLat = screen.lat,
    lonVelocity = 0,
    latVelocity = 0,
    dampingFactor = 0.2,
    // dampingFactor = 0.05,
    then = Date.now();
//Is mouse moving
var mouseStatusArray = [];
var mouseStatusCurrentX = 0,
    mouseStatusCurrentY = 0,
    mouseMoving = false,
    thisMouseTime,
    mouseMoveDistance = 0,
    mouseMoveDuration = 0,
    mouseMoveSpeed = 0;
//未分類的變數
var raycaster = new THREE.Raycaster();
var sky, sunSphere;
var scene = new THREE.Scene();
var isUserInteracting = false;
var moveSpeed = {
    speed: -0.05
    // speed: -0.175
    // speed: -0.05
};



//設定WebGL Render
//下下行有抗鋸齒
var renderer = new THREE.WebGLRenderer();
// var renderer = new THREE.WebGLRenderer({
//     antialias: true,
//     alpha: true
// });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



//添加相机
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
// camera.position.set(0, 54, 100);



//添加直射光
var dirLight = new THREE.DirectionalLight();
dirLight.position.set(0, 0, 300);
dirLight.color.setHSL(0.1, 0.7, 0.5);
scene.add(dirLight);

var textureLoader = new THREE.TextureLoader();
var textureFlare0 = textureLoader.load('pic/lensflare0.png');
var textureFlare3 = textureLoader.load('pic/lensflare3.png');
addLight(0.55, 0.9, 0.5, 5000, 2000, 5000);
addLight(0.08, 0.8, 0.5, 5000, 2000, 5000);
addLight(0.995, 0.5, 0.9, 5000, 2000, 5000);

function addLight(h, s, l, x, y, z) {
    var light = new THREE.PointLight(0xffffff, 1.5, 2000);
    light.color.setHSL(h, s, l);
    light.position.set(x, y, z);
    scene.add(light);
    var lensflare = new THREE.Lensflare();
    lensflare.addElement(new THREE.LensflareElement(textureFlare0, 700, 0, light.color));
    lensflare.addElement(new THREE.LensflareElement(textureFlare3, 60, 0.6));
    lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 0.7));
    lensflare.addElement(new THREE.LensflareElement(textureFlare3, 120, 0.9));
    lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 1));
    light.add(lensflare);
}



//載入相機控制器 (Orbitcontrol)
// var controls = new THREE.OrbitControls(camera);
// controls.enableZoom = true;
// controls.minDistance = 0;
// controls.maxDistance = 1000;
// controls.enableDamping = true;
// controls.dampingFactor = 0.2;
// controls.rotateSpeed = 0.5;
// controls.maxPolarAngle = Math.PI / 2;



//读取FBX模型
var loader = new THREE.FBXLoader();
var texLoader = new THREE.TGALoader();

loader.load('./lwf/1111.FBX', function (object) {
    object.traverse(function (child) {
        if (child.isMesh) {

            var texture1 = texLoader.load('lwf/' + child.name + 'VRay完成贴图.tga');
            var materal1 = new THREE.MeshBasicMaterial({
                map: texture1,
                transparent: true
            });
            child.material = materal1;
            child.castShadow = true;
            child.lights = true;
        }
    })

    object.scale.set(0.05, 0.05, 0.05);
    scene.add(object);
})



//加入場景背景 (CubeMap)
var path = "pic/";
var format = ".jpg";
var urls = [
    path + 'px' + format, path + 'nx' + format,
    path + 'py' + format, path + 'ny' + format,
    path + 'pz' + format, path + 'nz' + format
]
var reflectionCube = new THREE.CubeTextureLoader().load(urls);
reflectionCube.format = THREE.RGBFormat;
var refractionCube = new THREE.CubeTextureLoader().load(urls);
refractionCube.mapping = THREE.CubeRefractionMapping;
refractionCube.format = THREE.RGBFormat;

scene.background = reflectionCube;



//手機/電腦 START
// const clickEvent = (function () {
//     if ('ontouchstart' in document.documentElement === true)
//         return 'touchstart';
//     else
//         return 'click';
// })();


// const mouveMoveEvent = (function() {
//     if ('ontouchstart' in document.documentElement === true)
//       return 'touchmove';
//     else
//       return 'mousemove';
// })();
//   const ontouchmoveEvent = (function() {
//     if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))
//     // if ('touchmove' in document.documentElement === true)
//       return 'touchmove';
//     else
//       return 'mousemove';
//   })();
//手機/電腦 END




//滑鼠事件監聽器 [複製自view-360-panarama]
// element.addEventListener(clickEvent, test, false);
// element.addEventListener('mousewheel', onDocumentMouseWheel, false);
// element.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
window.addEventListener('click', scanMouseProjectToObject, false);
// window.addEventListener('click', scanMouseProjectToObject, false);
// element.addEventListener('mousemove', changeMouseCurrentXY, false);
// element.addEventListener('mousemove', a, false);
// element.addEventListener('mousemove', mouseMoveOnGroundPlayBack, false);


//檢測是否為手機
function isMobile() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}

if (isMobile()) {
    element.addEventListener('touchstart', onDocumentMouseDown, false);
    element.addEventListener('touchmove', test, false);
    element.addEventListener('touchmove', changeMouseCurrentXY, false);
    element.addEventListener('touchmove', a, false);
    // element.addEventListener('mousemove', mouseMoveOnGroundPlayBack, false);
    function changeMouseCurrentXY(event) {
        mouseStatusCurrentX = event.changedTouches[0].clientX;
        mouseStatusCurrentY = event.changedTouches[0].clientY;
        console.log("changeMouseCurrentXY success");
    }

    function a() {
        // event.preventDefault();
        mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
        console.log("a success");
    }

    function onDocumentMouseDown(event) {
        // event.preventDefault();
        onPointerDownPointerX = event.changedTouches[0].clientX;
        onPointerDownPointerY = event.changedTouches[0].clientY;
        onPointerDownLon = screen.lon;
        onPointerDownLat = screen.lat;
        isUserInteracting = true;
        element.addEventListener('touchmove', onDocumentMouseMove, false);
        element.addEventListener('touchend', onDocumentMouseUp, false);
    }

    function onDocumentMouseMove(event) {
        // createjs.Tween.get(moveSpeed).to({
        //     speed: -0.075
        // }, 500);

        //原始畫面移動公式
        if (isUserInteracting === true) {
            screen.lon = (event.changedTouches[0].clientX - onPointerDownPointerX) * moveSpeed.speed + onPointerDownLon;
            screen.lat = (event.changedTouches[0].clientY - onPointerDownPointerY) * moveSpeed.speed + onPointerDownLat;
        }

        // mouseCurrentX = event.clientX;
        // mouseCurrentY = event.clientY;

        // lon = (event.clientX - onPointerDownPointerX) * -0.175 + onPointerDownLon;
        // lat = (event.clientY - onPointerDownPointerY) * -0.175 + onPointerDownLat;
    }

    function onDocumentMouseUp(event) {
        // moveSpeed.speed = -0.175;
        isUserInteracting = false;
        element.removeEventListener('touchmove', onDocumentMouseMove, false);
        element.removeEventListener('touchend', onDocumentMouseUp, false);
    }
} else {
    element.addEventListener('mousedown', onDocumentMouseDown, false);
    element.addEventListener('mousemove', changeMouseCurrentXY, false);
    element.addEventListener('mousemove', a, false);
    element.addEventListener('mousemove', mouseMoveOnGroundPlayBack, false);

    function changeMouseCurrentXY(event) {
        mouseStatusCurrentX = event.clientX;
        mouseStatusCurrentY = event.clientY;
    }

    function a() {
        // event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = screen.lon;
        onPointerDownLat = screen.lat;
        isUserInteracting = true;
        element.addEventListener('mousemove', onDocumentMouseMove, false);
        element.addEventListener('mouseup', onDocumentMouseUp, false);
    }

    function onDocumentMouseMove(event) {
        // createjs.Tween.get(moveSpeed).to({
        //     speed: -0.075
        // }, 500);

        //原始畫面移動公式
        if (isUserInteracting === true) {
            screen.lon = (event.clientX - onPointerDownPointerX) * moveSpeed.speed + onPointerDownLon;
            screen.lat = (event.clientY - onPointerDownPointerY) * moveSpeed.speed + onPointerDownLat;
        }

        // mouseCurrentX = event.clientX;
        // mouseCurrentY = event.clientY;

        // lon = (event.clientX - onPointerDownPointerX) * -0.175 + onPointerDownLon;
        // lat = (event.clientY - onPointerDownPointerY) * -0.175 + onPointerDownLat;
    }

    function onDocumentMouseUp(event) {
        // moveSpeed.speed = -0.175;
        isUserInteracting = false;
        element.removeEventListener('mousemove', onDocumentMouseMove, false);
        element.removeEventListener('mouseup', onDocumentMouseUp, false);
    }
}









function test() {
    console.log(event);
    // console.log(event.changedTouches[0].clientX);
}







// function onDocumentMouseMove(event) {
//     // createjs.Tween.get(moveSpeed).to({
//     //     speed: -0.075
//     // }, 500);

//     //原始畫面移動公式
//     if (isUserInteracting === true) {
//         screen.lon = (event.clientX - onPointerDownPointerX) * moveSpeed.speed + onPointerDownLon;
//         screen.lat = (event.clientY - onPointerDownPointerY) * moveSpeed.speed + onPointerDownLat;
//     }

//     // mouseCurrentX = event.clientX;
//     // mouseCurrentY = event.clientY;

//     // lon = (event.clientX - onPointerDownPointerX) * -0.175 + onPointerDownLon;
//     // lat = (event.clientY - onPointerDownPointerY) * -0.175 + onPointerDownLat;
// }

// function onDocumentMouseUp(event) {
//     // moveSpeed.speed = -0.175;
//     isUserInteracting = false;
//     element.removeEventListener('mousemove', onDocumentMouseMove, false);
//     element.removeEventListener('mouseup', onDocumentMouseUp, false);
// }

function onDocumentMouseWheel(event) {
    // // WebKit
    // if (event.wheelDeltaY) {
    // 	fov -= event.wheelDeltaY * 0.05;
    // 	// Opera / Explorer 9
    // } else if (event.wheelDelta) {
    // 	fov -= event.wheelDelta * 0.05;
    // 	// Firefox
    // } else if (event.detail) {
    // 	fov += event.detail * 1.0;
    // }
    // if (fov < 45 || fov > 90) {
    // 	fov = (fov < 45) ? 45 : 90;
    // }
    // camera.projectionMatrix.makePerspective(fov, ratio, 1, 1100);
}



//Is mouse moving?

function saveMouseStatusToArray() {
    //得到最新的滑鼠位置，存在mouseStatus中
    // changeMouseCurrentXY();

    //替最新的滑鼠位置加入時間戳記，存在mouseStatus中
    var now = Date.now();
    thisMouseTime = now;

    //將最新的mouseStatus加入mouseStatusArray陣列中
    latestMouseStatus = new mouseStatus(mouseStatusCurrentX, mouseStatusCurrentY, mouseMoving, thisMouseTime, mouseMoveDistance, mouseMoveDuration, mouseMoveSpeed);
    mouseStatusArray.push(latestMouseStatus);
}

function mouseStatus(currentX, currentY, moving, time, moveDistance, mouseMoveDuration, mouseMoveSpeed) {
    this.currentX = currentX;
    this.currentY = currentY;
    this.moving = moving;
    this.time = time;
    this.moveDistance = moveDistance;
    this.mouseMoveDuration = mouseMoveDuration;
    this.mouseMoveSpeed = mouseMoveSpeed;
}

setInterval(isMouseMoving, 1000);

function isMouseMoving() {
    //確保mouseStatusArray陣列只有最新的兩個元素
    if (mouseStatusArray.length >= 3) {
        mouseStatusArray.shift();
    }

    //若mouseStatusArray有兩筆以上資料，計算滑鼠是否移動，並計算移動距離、耗時、速度
    if (mouseStatusArray.length >= 2) {
        //計算滑鼠是否移動
        if (mouseStatusArray[0].currentX !== mouseStatusArray[1].currentX && mouseStatusArray[0].currentY !== mouseStatusArray[1].currentY) {
            mouseMoving = true;
            //計算移動距離、耗時、速度
            mouseMoveDistance = Math.sqrt((mouseStatusArray[1].currentX - mouseStatusArray[0].currentX) ^ 2 + (mouseStatusArray[1].currentY - mouseStatusArray[0].currentY) ^ 2);
            mouseMoveDuration = (mouseStatusArray[1].time - mouseStatusArray[0].time);
            mouseMoveSpeed = mouseMoveDistance / mouseMoveDuration;
        } else {
            mouseMoving = false;
        }
    }

    saveMouseStatusToArray();
    if (mouseStatusArray.length >= 3) {
        // console.log(mouseStatusArray[2].moving);
    }

    // console.log(mouseStatusArray[2].mouseMoveSpeed * 100);
    // console.log(mouseStatus.moveSpeed);
}


//Is mouse moving? END



//視窗大小調整事件監聽器 [複製自view-360-panarama]
window.addEventListener('resize', onWindowResized, false);

function onWindowResized(event) {
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
    renderer.setSize(width, height);
    camera.projectionMatrix.makePerspective(fov, ratio, 1, 1100);
}



//主要相機控制模組
//渲染器 [複製自view-360-panarama]
function render() {
    screen.lat = Math.max(-85, Math.min(85, screen.lat));
    phi = THREE.Math.degToRad(90 - screen.lat);
    theta = THREE.Math.degToRad(screen.lon);
    // camera.position.x = 1 * Math.sin(phi) * Math.cos(theta);
    // camera.position.y = 1 * Math.cos(phi);
    // camera.position.z = 1 * Math.sin(phi) * Math.sin(theta);
    camera.position.x = cameraPosition.x + 1 * Math.sin(phi) * Math.cos(theta);
    camera.position.y = cameraPosition.y + 1 * Math.cos(phi);
    camera.position.z = cameraPosition.z + 1 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z));
    renderer.render(scene, camera);
    // var log = ("x: " + Math.round(camera.position.x * 1000000000000) / 1000000000000);
    // log = log + ("<br/>y: " + Math.round(camera.position.y * 1000000000000) / 1000000000000);
    // log = log + ("<br/>z: " + Math.round(camera.position.z * 1000000000000) / 1000000000000);
    // // var log = ("x: " + camera.position.x);
    // // log = log + ("<br/>y: " + camera.position.y);
    // // log = log + ("<br/>z: " + camera.position.z);
    // log = log + ("<br/>fov: " + fov);
    // document.getElementById('log').innerHTML = log;
    // camera.lookAt(scene.position);
}



//主動畫animate()
function animate() {
    requestAnimationFrame(animate);
    // controls.update();
    // console.log(mouseMoving);
    updateFriction();
    render();
    // isMouseMoving();
    // mouseMoveOnGroundPlayBack();
    // moveMouseGroundPlayBack(event);
    // if(sphereMesh2){} else {
    //     scene.add(sphereMesh2);
    // }
    // printCameraLog();
}
animate();



//畫面摩擦力 Start
function updateFriction() {

    // Get time since last frame
    var now = Date.now();
    var dT = now - then;

    if (isUserInteracting) {
        // Get distance travelled since last frame
        var dLon = screen.lon - prevLon;
        var dLat = screen.lat - prevLat;
        // velocity = distance / time
        lonVelocity = dLon / dT;
        latVelocity = dLat / dT;
    } else {
        // old position + ( velocity * time ) = new position
        screen.lon += lonVelocity * dT;
        screen.lat += latVelocity * dT;
        lonVelocity *= (1 - dampingFactor);
        latVelocity *= (1 - dampingFactor);
    }
    // if (isUserInteracting) {
    //     var dLon = lon - prevLon;
    //     var dLat = lat - prevLat;

    //     lonVelocity = dLon / dT;
    //     latVelocity = dLat / dT;
    // } else {
    //     lon += lonVelocity * dT;
    //     lat += latVelocity * dT;
    //     lonVelocity *= (1 - dampingFactor);
    //     latVelocity *= (1 - dampingFactor);
    // }

    // Save these for next frame
    then = now;
    prevLon = screen.lon;
    prevLat = screen.lat;

}
//畫面摩擦力 End



//按照滑鼠點擊位置，設定camera視線中心點的x和y
function setCameraPositionByClickXY(positionVector) {
    createjs.Tween.get(cameraPosition).to({
        x: positionVector.x
    }, 1000, createjs.Ease.cubicInOut);
    createjs.Tween.get(cameraPosition).to({
        z: positionVector.z
    }, 1000, createjs.Ease.cubicInOut);
}



//計算滑鼠點擊與平面交界 (Raycaster)
var mouse = new THREE.Vector2();

function scanMouseProjectToObject(event) {

    //將mouse的螢幕xy座標，轉換為三度空間世界座標的向量的xy
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //更新raycaster
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children[5].children);
    if (intersects[0].object.name == "Box003") {
        setCameraPositionByClickXY(intersects[0].point);
    } else {
        // console.log("no")
    };
    // console.log(intersects[0].point);
    // clickGroundPlayBack(intersects[0].point);
}



//滑鼠在地面上移動視覺回饋



var geometryMoMo = new THREE.CylinderGeometry(12, 12, 1, 45);
// var geometryMoMo = new THREE.SphereBufferGeometry(5);
var materialMoMo = new THREE.MeshBasicMaterial({
    color: 0xffffff
});

sphereInter = new THREE.Mesh(geometryMoMo, materialMoMo);
sphereInter.visible = false;
sphereInter.material.transparent = true;
sphereInter.material.opacity = 0.1;
sphereInter.material.blending = THREE.AdditiveBlending;
scene.add(sphereInter);
// console.log(sphereInter.material);
// console.log(THREE.AdditiveBlending);

function mouseMoveOnGroundPlayBack() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children[5].children, true);

    if (intersects.length > 0 && intersects[0].object.name == "Box003") {
        sphereInter.visible = true;
        sphereInter.position.copy(intersects[0].point);
        renderer.domElement.style.cursor = "pointer";
        // console.log(intersects[0].object.name);
    } else {
        sphereInter.visible = false;
        renderer.domElement.style.cursor = "";
    }
    // renderer.render(scene, camera);
}

renderer.domElement.style.overflow = "hidden";







// // 滑鼠點擊地面的視覺回饋
// var sphere = {
//     in: {
//         ratio: 10,
//         height: 10,
//     },
//     out: {}
// }

// function clickGroundPlayBack(targetPoint) {



//     // var sphereInGeo = new THREE.CylinderGeometry(sphere.in.ratio, sphere.in.ratio, sphere.in.height);
//     // var sphereInMat = new THREE.MeshLambertMaterial({
//     //     color: 0xFF0000,
//     //     wireframe: false
//     // })
//     // var sphereMesh2 = new THREE.Mesh(sphereInGeo, sphereInMat);
//     // sphereMesh2.position.set(targetPoint.x, 0, targetPoint.z);
//     // // scene.add(sphereMesh2);
//     // createjs.Tween.get(sphere.in).to({
//     //     ratio: 20
//     // }, 10000);
//     // console.log(sphere);



// }



// //及時設定
// //建立紅球
// //建立圓形 (半徑, 水平分段數(預設8), 垂直分段數(預設6))
// var sphereGeometry = new THREE.SphereBufferGeometry(10, 32, 32);
// var sphereMaterial = new THREE.MeshBasicMaterial({
//     color: 0xff0000
// });
// //一直增加紅球數量直到40顆
// for (var i = 0; i < 40; i++) {
//     var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//     scene.add(sphere);
//     spheres.push(sphere);
// }



// function moveMouseGroundPlayBack(event) {

//     //將mouse的螢幕xy座標，轉換為三度空間世界座標的向量的xy
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     //更新raycaster
//     raycaster.setFromCamera(mouse, camera);
//     var intersects = raycaster.intersectObjects(scene.children[4].children);

//     //每隔0.02秒繪製一顆紅點
//     if (toggle > 0.02 && intersects !== null) {
//         //將新的紅球位置設定為intersects.point的位置
//         spheres[spheresIndex].position.x.copy(intersects.point.x);
//         spheres[spheresIndex].position.z.copy(intersects.point.z);
//         //設定紅球的縮放
//         spheres[spheresIndex].scale.set(1, 1, 1);
//         //
//         spheresIndex = (spheresIndex + 1) % spheres.length;
//         toggle = 0;
//     }
//     for (var i = 0; i < spheres.length; i++) {
//         var sphere = spheres[i];
//         sphere.scale.multiplyScalar(0.98);
//         sphere.scale.clampScalar(0.01, 1);
//     }

//     // console.log("success");
//     // console.log(event.clientX);

// }
// element.addEventListener('mousemove', moveMouseGroundPlayBack, false);









//---------------------------除錯輔助工具---------------------------

//HTML按鈕事件 - 按一下增加減少相機視線中心x、y、z軸10，並更新注視點紅球位置
// function increaseCameraPosition(axial) {
//     if (axial == "cameraPositionX") {
//         cameraPosition.x += 10;
//     }
//     if (axial == "cameraPositionY") {
//         cameraPosition.y += 10;
//     }
//     if (axial == "cameraPositionZ") {
//         cameraPosition.z += 10;
//     }
//     //更新注視點紅球位置
//     sphereMesh2.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
//     // scene.add(sphereMesh2);
// }
// function decreaseCameraPosition(axial) {
//     if (axial == "cameraPositionX") {
//         cameraPosition.x -= 10;
//     }
//     if (axial == "cameraPositionY") {
//         cameraPosition.y -= 10;
//     }
//     if (axial == "cameraPositionZ") {
//         cameraPosition.z -= 10;
//     }
//     //更新注視點紅球位置
//     sphereMesh2.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
//     // scene.add(sphereMesh2);
// }


// //HTML按鈕事件 - 切換相機到指定位置
// function logCamera() {
//     console.log(camera);
// }
// function changeCameraView1() {
//     camera.position.set(1.52, 49.08, -407.62);
//     camera.rotation.set(-3.14, 0.31, 3.14);
// }
// function changeCameraView2() {
//     camera.position.set(-97.94, 55.70, -93.74);
//     camera.rotation.set(-8.023, -0.436, -3.39);
//     // camera.rotation.set(-4.66, -0.40, -1.85);
// }


// //HTML按鈕事件 - 控制相機注視的點，每按一下按鈕該軸向+10
// function ChangeCameraTarget(axial) {
//     if (axial == "cameraTargetX") {
//         cameraTargetX += 10;
//     }
//     if (axial == "cameraTargetY") {
//         cameraTargetY += 10;
//     }
//     if (axial == "cameraTargetZ") {
//         cameraTargetZ += 10;
//     }
//     controls.target.x = cameraTargetX;
//     controls.target.y = cameraTargetY;
//     controls.target.z = cameraTargetZ;

//     //更新注視點黑球位置
//     sphereMesh.position.set(cameraTargetX, cameraTargetY, cameraTargetZ);
//     scene.add(sphereMesh);

//     console.log(controls.target);
//     return axial;
// }


// //HTML按鈕事件 - 移除場景中最後一個新增的物件
// function removeCube() {
//     var allChildren = scene.children;
//     var lastObject = allChildren[allChildren.length - 1];
//     if (lastObject instanceof THREE.Mesh) {
//         scene.remove(lastObject);
//         this.numberOfObjects = scene.children.length;
//     }
// }


// //HTML按鈕事件 - 按鈕輸出相機log
// function printCameraLog() {

//     document.getElementById('log').innerHTML =
//         "camera.position.x = " + camera.position.x + "<br>camera.position.y = " + camera.position.y +
//         "<br>camera.position.z = " + camera.position.z +
//         "<br>camera.rotation._x = " + camera.rotation._x + "<br>camera.rotation._y = " + camera.rotation._y +
//         "<br>camera.rotation._z = " + camera.rotation._z +
//         "<br>camera look at point x = " + cameraPosition.x + "<br>camera look at point x = " + cameraPosition.y +
//         "<br>camera look at point x = " + cameraPosition.z;
// }


// //變換選取到的物件的material

// function materialToRed(target) {
//     var materialToRedMaterial = new THREE.MeshBasicMaterial({
//         color: 0x00ff00
//     });
//     // for( i = 0; i < target.length; i++) {
//     // 	target[i].object.material = materialToRedMaterial;
//     // }
//     target[0].object.material = materialToRedMaterial;
//     console.log("materilaToRed target = ↓");
//     console.log(target);
// }

// //在相機注視原始點生成黑球
// var sphereR = 10;
// var sphereGeo = new THREE.SphereGeometry(sphereR, sphereR, sphereR);
// var sphereMat = new THREE.MeshLambertMaterial({
//     // color: ff0000FF,
//     color: 0x0000FF,
//     wireframe: false
// })
// var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
// sphereMesh.position.set(cameraTargetX, cameraTargetY, cameraTargetZ);
// scene.add(sphereMesh);

//在相機注視點生成紅球
// var sphereR2 = 0.01;
// var sphereGeo2 = new THREE.SphereGeometry(sphereR2, sphereR2, sphereR2);
// var sphereMat2 = new THREE.MeshLambertMaterial({
//     // color: ff0000FF,
//     color: 0xFF0000,
//     wireframe: false
// })
// var sphereMesh2 = new THREE.Mesh(sphereGeo2, sphereMat2);
// sphereMesh2.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
// scene.add(sphereMesh2);

// //增加/減少畫面移動速度
// //當按住畫面時，開始不斷監聽滑鼠是否正在移動，若正在移動則將畫面移動速度提升，反之降低
// setInterval(() => {

//     //當滑鼠按住畫面時，開始調整畫面移動速度
//     if (isUserInteracting) {

//         //mouseStatusArray有三筆以上資料，才執行判斷滑鼠移動狀態邏輯
//         if (mouseStatusArray.length >= 1) {

//             //如果滑鼠移動狀態有改變，才判斷滑鼠是否正在移動
//             if (mouseStatusArray[2].moving !== mouseStatusArray[1].moving) {

//                 //判斷滑鼠是否正在移動
//                 if (mouseStatusArray[2].moving) {
//                     createjs.Tween.get(moveSpeed).to({
//                         speed: -0.035
//                     }, 500);
//                 } else {
//                     createjs.Tween.get(moveSpeed).to({
//                         speed: -0.005
//                     }, 500);
//                 }
//             }
//         }
//     }

//     console.log(moveSpeed.speed);

// }, 500);


//計算滑鼠移動速度 START

// var mouseMoveDistance = Math.sqrt((mouseStatusArray[1].currentX - mouseStatusArray[0].currentX)^2 + (mouseStatusArray[1].currentY - mouseStatusArray[0].currentY)^2);
// var mouseMoveDuration = (mouseStatusArray[1].time - mouseStatusArray[0].time);
// var mouseMoveSpeed = mouseMoveDistance / mouseMoveDuration;

//計算滑鼠移動速度 END





// //增加/減少畫面移動速度 END
//畫面平移 Start
// var mouseCurrentX = 0, mouseCurrentY = 0;

// element.addEventListener('mousemove', renewMouseClientXY,false);

// function renewMouseClientXY() {
//     mouseCurrentX = event.clientX;
//     mouseCurrentY = event.clientY;
// }

// var lastLon = lon, lastLat = lat;
// setInterval(() => {
//     if (isUserInteracting === true) {
//         lastLon = lon;
//         lastLat = lat;
//         newLon = (mouseCurrentX - onPointerDownPointerX) * moveSpeed.speed + onPointerDownLon;
//         newLat = (mouseCurrentY - onPointerDownPointerY) * moveSpeed.speed + onPointerDownLat;
//         createjs.Tween.get(lon).to({
//             this: newLon
//         }, 1000);
//         createjs.Tween.get(lat).to({
//             this: newLat
//         }, 1000);
//     }
// }, 100);

// function log() {
//     console.log(lastLon);
//     console.log(lastLat);
//     console.log(lon);
//     console.log(lat);
// }
//畫面平移 End