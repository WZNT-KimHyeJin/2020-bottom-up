
const URL = "./my_model/"; // 마스크착용 여부 확인 티쳐블
const URL_P = "./my_model_2/"; // 사람 존재 여부 확인 티쳐블
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";

let model, webcam, labelContainer, maxPredictions;
let p_model, p_labelContainer, p_maxPredictions;


var audio1 = new Audio("./검사가 완료되었습니다.mp3");
var audio2 = new Audio("./마스크를 착용해주세요.mp3");
var audio3 = new Audio("./마스크 착용은 필수입니다.mp3");
let maskimgsrc = "maskimg.jpg";
let alert_maskOn = "alert_maskOn.jpg";
let alert_maskOff = "alert_maskOff.jpg";
let soundOn = "soundOn.jpg";
let soundOff = "soundOff.jpg";


let checkLoop = 0;
let checkResult; // 판정 값 check()로부터의 반환값을 받아온다.
let stopOperate =0; // stop 버튼 활성화 여부 0: 비활성화, 1 : 판단 정지
let pauseOperate =0; // pause 활성화 여부 0: 판단중, 1: 판단 일시정지
var mutecheck = 0; // 0= sound On , 1 = mute
var countmaskon;
var countmaskoff;
var count;

let start_btn = document.getElementById("start_btn");
let stop_btn = document.getElementById("stop_btn");
let pause_btn = document.getElementById("pause_btn");
var muteSound = document.getElementById("mute");
let warningText = document.getElementsByClassName("warningText");    
let mymodal = document.getElementById("myModal");//마스크 확인 띄울 모달
let imfomodal = document.getElementById("imfoModal");//정보띄울 모달 
var span = document.getElementsByClassName("close")[0];



const flip = true; 
webcam = new tmImage.Webcam(300, 300, flip); 

async function p_init() { // 검사 시작 버튼 실행 함수
  var title = document.getElementById("index_title");
  title.style.fontSize = "30px";
  start_btn.style.display = "none"; 
  stop_btn.style.display="block"; 
  pause_btn.style.display="block";
  document.getElementById("index_body").style.margin = "10px";
  document.getElementById("index_body").style.padding = "10px";
  document.getElementById("index_title").style.margin = "10px";
  document.getElementById("index_title").style.padding = "0px";
  document.getElementById("maskOn").style.display='block';  
  document.getElementById("maskOff").style.display='block'; 
  document.getElementById("count_1").style.display='block'; 
  document.getElementById("count_2").style.display='block'; 
  document.getElementById("LD").style.display='block';

  
  const modelURL_P = URL_P + "p_model.json";
  const metadataURL_P = URL_P + "p_metadata.json";
  
  p_model = await tmImage.load(modelURL_P, metadataURL_P);
  p_maxPredictions = p_model.getTotalClasses();
  
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  //위에 Init 함수 로딩 시간 단축을 위해 미리 로딩
  
  await webcam.setup(); 
  await webcam.play();
document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < p_maxPredictions; i++) { 
      labelContainer.appendChild(document.createElement("div"));
  }
  document.getElementById("LD").style.display='none';
  
  window.requestAnimationFrame(p_loop); // p_loop 함수 실행
  
}
async function p_loop() {
  labelContainer.childNodes[0].innerHTML = null;
  webcam.update(); 
  if(pauseOperate==1){
    return;
  }
  
  checkPre = await p_predict(); 
  
  if(checkPre==1||pauseOperate==2){
      console.log="사람 있음"
      for(let i=0;i<20;i++){
       webcam.update();
      }
      init();
  }
  else{
      window.requestAnimationFrame(p_loop);
  }
}

async function p_predict() {
  const prediction_P = await p_model.predict(webcam.canvas);
 if(prediction_P[0].className=="someoneInHere"&&prediction_P[0].probability.toFixed(2)>0.90){
  return 1;
 }else{
     return 0;
 }
}


function dropdownclick() { //왼쪽 상단 메뉴 버튼 실행 함수
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {

        openDropdown.classList.remove('show');
      }
    }
  }
}

// dropdown 시에 보여지는 소메뉴 작동 함수
// 어플 사용 안내
async function imfo_f(){  
  imfomodal.style.display = "block";
  document.getElementById("introMaskimg").src = "developer.jpg";
}
// 올바른 마스크 착용 방법
async function intromask_f(){
  imfomodal.style.display = "block";
  document.getElementById("introMaskimg").src = "wearMask.jpg";
}
// 어플 사용 안내 내용 띄우는 모달
span.onclick = function(){
  imfomodal.style.display = "none"; 
}



// 음소거 버튼 실행 함수
muteSound.onclick=function(){
  if(mutecheck==0){
    audio1.muted=true;
    audio2.muted=true;
    audio3.muted=true;
    mutecheck=1;
    document.getElementById("mute").src = soundOff;
  }else{
    audio1.muted=false;
    audio2.muted=false;
    audio3.muted=false;
    mutecheck=0;
    document.getElementById("mute").src = soundOn;

  }
}



async function stopPlay(){ // 정지 버튼을 누를 때 실행되는 함수
  stopOperate=1; // 정지 버튼 활성화
  webcam.stop(); // 웹캠 플레이 정지
  var title = document.getElementById("index_title");
  title.style.fontSize = "7rem";
  document.getElementById("index_title").style.marginTop= "60px";
  document.getElementById("index_title").style.padding = "60px";
  stop_btn.style.display="none"; // 종료 버튼 안보이게
  pause_btn.style.display="none"; // 일시정지버튼 안보이게
  labelContainer.childNodes[0].innerHTML = "검사가 종료되었습니다."; // 글씨 변경
  document.getElementById("mute").style.display="none"
  document.getElementById("webcam-container").innerHTML = null; // 웹캠 띄운 화면을 안보이게 함
  console.log("플레이 정지!!!"); // 콘솔창에 띄워서 확인
  CheckResult=100; // predict 함수에 쓰일 판단값을 변경
 
  await new Promise((resolve,reject) => {
      predict();
      resolve("");
  });
}
async function pausePRD(){ // 일시 정지 버튼을 누를 때 실행되는 함수
  if(pauseOperate==0){ // 처음 일시정지 누를 때
    pauseOperate=1;
    webcam.pause();
    document.getElementById("pause_btn").innerHTML="검사 진행";
    predict();
  }else if(pauseOperate==1){ // 일시정지
    pauseOperate=2;
    webcam.pause();
    document.getElementById("pause_btn").innerHTML="일시정지";
    loop();
  }else if(pauseOperate==2){ // 다시 재생
    pauseOperate=0;
    webcam.play();
    await webcam.play();
    predict();
  }
  
}


async function init() {
  window.requestAnimationFrame(loop); 
  document.getElementById("webcam-container").appendChild(webcam.canvas);
}

async function loop() {
  await webcam.update(); 
  if(pauseOperate==1){
    return;
  }
  else if(pauseOperate==2){
    checkLoop=120;
  }
  if(stopOperate==1){ //정지 버튼 활성화 시 루프 탈출
      checkLoop=200;
  }
  
  if(checkLoop==120){
      var check_predict = await predict(); // 판단 여부를 변수값에 저장
      //0 : 정지 버튼 눌렀을 떄 , 1 : 진행 -2 : 일시정지

      if(check_predict==0){
          return;//정지 버튼 or 일시정지를 눌렀을 때 함수를 탈출하여 실행 정지
      }

      await webcam.play(); 
      checkLoop=0; //루프 체크 변수 초기화

      if(check_predict==1){
          window.requestAnimationFrame(p_loop); 
      }
  }
  else if(checkLoop<120){
      labelContainer.childNodes[0].innerHTML = "화면에 얼굴을 비춰주세요.";
      checkLoop++;
      window.requestAnimationFrame(loop); 
  }
}

function check(prediction){//predict()의 prediction배열을 파라미터로 받음
  
  
  return new Promise(function(resolve,reject){
      if(stopOperate==1){
          resolve(-1); // 정지버튼을 눌렀을 경우 -1을 반환
      }
      if(pauseOperate==2){
        resolve(-7); // -7반환하여 재생 여부 확인
      }
      if(prediction[0].className == "mask" && prediction[0].probability.toFixed(2)>=0.70){
          resolve(1); // 마스크 착용 시 1을 반환
      }else if(prediction[1].className == "no mask" && prediction[1].probability.toFixed(2)>=0.70){
          resolve(0); //마스크 미착용시 0을 반환
      }else{
          resolve(100); //착용 여부가 불분명할 경우 100을 반환
      }
      reject(-100); //실행 불가 시 -100반환
  });
}


async function predict() {
  // 예측 진행 함수
  if(pauseOperate==1){
    return 1;
  }
  let checkState = 0; // 현재 상태 확인 변수 
  
  await webcam.pause();
  const prediction = await model.predict(webcam.canvas);
  
  checkResult = await check(prediction); 
  //-1 : 정지 , 0 : 미착용 , 1 : 착용 , 100 : 불분명, -7 : 일시정지
  if(checkResult==-1){ //정지버튼을 눌렀을 경우 checkState를 0으로 변환하여 반환
    return checkState;
  }
  
  await new Promise((resolve, reject) => {
    mymodal.style.display = "block";
    resolve("");
  });

  if (checkResult == 1) { // 마스크를 착용 하였을 때
    audio1.currentTime = 0;
    audio1.play();
    document.getElementById("text").innerHTML = "검사가 완료되었습니다.";
    document.getElementById("maskimg").src = alert_maskOn;

    document.getElementById("modalText").style.display="none";

    await countmaskon();
    
    count = document.getElementsByClassName("count_1").innerHTML;
    count++;
    document.getElementsByClassName("count_1").innerHTML = count;
    
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        audio1.pause();
        resolve("");
      }, 2000);
    });
  } else if (checkResult == 0) {//마스크 미착용 시
    audio2.currentTime = 0;
    audio2.play();
    document.getElementById("text").innerHTML = "마스크를 착용해주세요!";
    document.getElementById("maskimg").src = alert_maskOff;
    document.getElementById("warningCNT").innerHTML=document.getElementById("count_1").innerHTML;
    document.getElementById("modalText").style.display="block";
    
    await countmaskoff();

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        audio2.pause();
        resolve("");
      }, 2000);
    });
    audio3.currentTime = 0;
    audio3.play();
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        audio3.pause();
        resolve("");
      }, 2000);
    });
  }else if(checkResult==-7){
    document.getElementById("text").innerHTML ="검사를 계속 진행하겠습니다.";
    document.getElementById("maskimg").style.display = "none";
    document.getElementById("modalText").style.display="none";
    pauseOperate=0;
  }
  else{
    document.getElementById("text").innerHTML ="다시 검사하겠습니다.";
    document.getElementById("maskimg").style.display = "none";
    document.getElementById("modalText").style.display="none";
  }
  checkState = await new Promise((resolve, reject) => {
    setTimeout(() => {
      audio1.pause();
      mymodal.style.display = "none";
      document.getElementById("maskimg").style.display = "block";
      resolve(1);
    }, 1000);
  });
  
  
  function countmaskon() {
    countmaskon = document.getElementById("count_1").innerHTML;
    countmaskon++;
    document.getElementById("count_1").innerHTML = countmaskon;
  }
  
  function countmaskoff(){
    countmaskoff = document.getElementById("count_2").innerHTML;
    countmaskoff++;
    document.getElementById("count_2").innerHTML = countmaskoff;
  }
  return checkState;
  
}
///////////////////사람 존재 여부 판독////////////////////////////



