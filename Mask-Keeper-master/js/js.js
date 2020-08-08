const URL = "./my_model/"; // 마스크 여부를 확인하는 티쳐블
const URL_P = "./my_model_2/"; // 사람 여부를 확인 하는 티쳐블
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";

let model, webcam, labelContainer, maxPredictions;
let p_model, p_labelContainer, p_maxPredictions;// 사람 여부 확인 티쳐블 변수

let checkLoop = 0; // 전역변수로 체킹 변수 설정
let modal = document.getElementById("myModal");
var audio1 = new Audio("./검사가 완료되었습니다.mp3");
var audio2 = new Audio("./마스크를 착용해주세요.mp3");
var audio3 = new Audio("./마스크 착용은 필수입니다.mp3");
let maskimgsrc = "maskimg.png";
let alert_maskOn = "alert_maskOn.png";
let alert_maskOff = "alert_maskOff.png";

let checkResult; // 판정 값 check함수로부터의 반환값을 받아온다.
let stopOperate =0; // stop 버튼 활성화 여부 0: 비활, 1 : 정지

let start_btn = document.getElementById("start_btn");
let stop_btn = document.getElementById("stop_btn");

var muteSound = document.getElementById("mute");
var mutecheck = 0; // 0= soundOn , 1 = mute

let warningText = document.getElementsByClassName("warningText");    


var countmaskon;
var countmaskoff;

var count;

const flip = true; 
webcam = new tmImage.Webcam(300, 300, flip); 

async function stopPlay(){ // 정지 버튼을 누를 때 실행되는 함수
  stopOperate=1; // 정지 버튼 활성화
  webcam.stop(); // 웹캠 플레이 정지
  stop_btn.style.display="none"; // 종료 버튼 안보이게
  labelContainer.childNodes[0].innerHTML = "검사가 종료되었습니다."; // 글씨 변경
  document.getElementById("webcam-container").innerHTML = null; // 웹캠 띄운 화면을 안보이게 함
  console.log("플레이 정지!!!"); // 콘솔창에 띄워서 확인
  CheckResult=100; // predict 함수에 쓰일 판단값을 변경
  await new Promise((resolve,reject) => {
      predict();
      resolve("");
  });
  

}
muteSound.onclick=function(){
  if(mutecheck==0){
    audio1.muted=true;
    audio2.muted=true;
    audio3.muted=true;
    mutecheck=1;
  }else{
    audio1.muted=false;
    audio2.muted=false;
    audio3.muted=false;
    mutecheck=0;
  }
}


async function init() {
  window.requestAnimationFrame(loop); 
  document.getElementById("webcam-container").appendChild(webcam.canvas);
}

async function loop() {
  await webcam.update(); 
  
  if(stopOperate==1){ //정지 버튼 활성화 시 루프 탈출
      checkLoop=200;
  }

  if(checkLoop==150){
      var check_predict = await predict(); // 판단 여부를 변수값에 저장
      //0 : 정지 버튼 눌렀을 떄 , 1 : 진행

      if(check_predict==0){
          return;//정지 버튼을 눌렀을 때 함수를 탈출하여 실행 정지
      }

      await webcam.play(); 
      checkLoop=0; //루프 체크 초기화

      if(check_predict==1){
          window.requestAnimationFrame(p_loop); //순서 변경 x 
      }
  }
  else if(checkLoop<150){
      labelContainer.childNodes[0].innerHTML = "화면에 얼굴을 비춰주세요.";
      checkLoop++;
      window.requestAnimationFrame(loop); //순서 변경 x 
  }
}

function check(prediction){//predict()의 prediction배열을 파라미터로 받음
  return new Promise(function(resolve,reject){
      if(stopOperate==1){
          resolve(-1); // 정지버튼을 눌렀을 경우 -1을 반환
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
  let checkState = 0; // 현재 상태 확인 변수 

  await webcam.pause();

  const prediction = await model.predict(webcam.canvas);

  checkResult = await check(prediction); 
    //-1 : 정지 , 0 : 미착용 , 1 : 착용 , 100 : 불분명
    if(checkResult==-1){ //정지버튼을 눌렀을 경우 checkState를 0으로 변환하여 반환
        return checkState;
    }

  await new Promise((resolve, reject) => {
    modal.style.display = "block";
    resolve("");
  });

  if (checkResult == 1) { // 마스크를 착용 하였을 때
    audio1.currentTime = 0;
    audio1.play();
    document.getElementById("text").innerHTML = "검사가 완료되었습니다.";
    document.getElementById("maskimg").src = alert_maskOn;
    for(let i=0;i<warningText.length;i++){
      warningText[i].style.display='none';
    }

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
    document.getElementById("warningCNT").innerHTML=countmaskon;
    for(let i=0;i<warningText.length;i++){
      warningText[i].style.display='block';
    }
    
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
  }else{
    document.getElementById("text").innerHTML ="다시 검사하겠습니다.";
  }
  checkState = await new Promise((resolve, reject) => {
    setTimeout(() => {
      audio1.pause();
      modal.style.display = "none";
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
//////////////////////////////////////////////////////////////////
async function p_init() {
  start_btn.style.display = "none"; // 시작 버튼 안보이게
  stop_btn.style.display="block"; // 종료 버튼 보이게
  document.getElementById("maskOn").style.display='block';  // 마스트 쓴 이미지 띄우기
  document.getElementById("maskOff").style.display='block'; // 화난 애 이미지 띄우기
  document.getElementById("count_1").style.display='block'; //마스크 쓴 카운팅 띄우기
  document.getElementById("count_2").style.display='block'; //마스크 안쓴 카운팅 띄우기

  const modelURL_P = URL_P + "p_model.json";
  const metadataURL_P = URL_P + "p_metadata.json";
  
  
  p_model = await tmImage.load(modelURL_P, metadataURL_P);
  p_maxPredictions = p_model.getTotalClasses();
  
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  //위에 Init 함수 로딩 시간 단축을 위하여 여기서 로딩
  
  await webcam.setup(); 
  await webcam.play();
  
  window.requestAnimationFrame(p_loop); // p_loop 함수 실행
  
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < p_maxPredictions; i++) { 
      labelContainer.appendChild(document.createElement("div"));
  }
}
async function p_loop() {
  labelContainer.childNodes[0].innerHTML = null;
  webcam.update(); // update the webcam frame
  
  checkPre = await p_predict();
  if(checkPre==1){
      console.log="사람 있음"
      for(let i=0;i<20;i++){
       webcam.update(); // update the webcam frame
      }
      init();
  }else{
    if(stopOperate==1){
      //한번도 판단을 안했을 때에도 정지버튼을 눌렀을 경우 함수탈출에 의해 판단종료
      return ; 
    }
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