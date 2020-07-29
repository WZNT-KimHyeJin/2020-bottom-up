const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;
let checkLoop = 0; // 전역변수로 체킹 변수 설정
let modal = document.getElementById("myModal");
var audio1 = new Audio("./검사가 완료되었습니다.mp3");
var audio2 = new Audio("./마스크를 착용해주세요.mp3");
var audio3 = new Audio("./마스크 착용은 필수입니다.mp3");
let maskimgsrc = "maskimg.png";

let checkResult; // 판정 값 check함수로부터의 반환값을 받아온다.
let stopOperate =0; // stop 버튼 활성화 여부 0: 비활, 1 : 정지

let start_btn = document.getElementById("start_btn");
let stop_btn = document.getElementById("stop_btn");


var countmaskon;
var countmaskoff;

var count;


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


async function init() {
  //start 버튼 누르면 실행되는 함수 우리가 만든 모델을 불러온다
  start_btn.style.display = "none"; // 시작 버튼 안보이게
  stop_btn.style.display="block"; // 종료 버튼 보이게
  document.getElementById("maskOn").style.display='block';  // 마스트 쓴 이미지 띄우기
  document.getElementById("maskOff").style.display='block'; // 화난 애 이미지 띄우기
  document.getElementById("count_1").style.display='block'; //마스크 쓴 카운팅 띄우기
   document.getElementById("count_2").style.display='block'; //마스크 안쓴 카운팅 띄우기
  
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true; 
  webcam = new tmImage.Webcam(400, 400, flip); // 
  await webcam.setup();
  await webcam.play(); //웹캠 재생

  window.requestAnimationFrame(loop); 
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container"); 
  for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
  }
}

async function loop() {
  await webcam.update(); 
  
  if(stopOperate==1){ //정지 버튼 활성화 시 루프 탈출
      checkLoop=200;
  }

  if(checkLoop==150){
      console.log("1_판단을 시작하지!");
      var check_predict = await predict(); // 판단 여부를 변수값에 저장
      //0 : 정지 버튼 눌렀을 떄 , 1 : 진행

      if(check_predict==0){
          return;//정지 버튼을 눌렀을 때 함수를 탈출하여 실행 정지
      }

      await webcam.play(); 
      console.log("8_Play!! DID!!!");
      checkLoop=0; //루프 체크 초기화

      if(check_predict==1){
          window.requestAnimationFrame(loop); //순서 변경 x 
      }
  }
  else if(checkLoop<150){
      labelContainer.childNodes[0].innerHTML = "화면에 얼굴을 비춰주세요.";
      //이거도 어떻게 못할까....흐으으음
      checkLoop++;
      console.log("1번 : 루프돌자 슝슝");
      window.requestAnimationFrame(loop); //순서 변경 x 
  }
}

function check(prediction){//predict()의 prediction배열을 파라미터로 받음
  console.log("5_check함수 실행");
  console.log("stop 여부 : "+ stopOperate);
  return new Promise(function(resolve,reject){
      if(stopOperate==1){
          resolve(-1); // 정지버튼을 눌렀을 경우 -1을 반환
      }
      if(prediction[0].className == "mask" && prediction[0].probability.toFixed(2)>=0.70){
          resolve(1); // 마스크 착용 시 1을 반환
          console.log("6_착용");
      }else if(prediction[1].className == "no mask" && prediction[1].probability.toFixed(2)>=0.70){
          resolve(0); //마스크 미착용시 0을 반환
          console.log("6_미착용"); 
      }else{
          resolve(100); //착용 여부가 불분명할 경우 100을 반환
          console.log("6_불분명함");
      }
      reject(-100); //실행 불가 시 -100반환
  });
}


async function predict() {
  // 예측 진행 함수
  let checkState = 0; // 현재 상태 확인 변수 
  console.log("2_predict 함수 실행");

  await webcam.pause();
  console.log("3_일시정지 완료");

  const prediction = await model.predict(webcam.canvas);
  console.log("4_predict success");

  checkResult = await check(prediction); 
    //-1 : 정지 , 0 : 미착용 , 1 : 착용 , 100 : 불분명
    if(checkResult==-1){ //정지버튼을 눌렀을 경우 checkState를 0으로 변환하여 반환
        return checkState;
    }
  console.log("result값: " + checkResult);

  await new Promise((resolve, reject) => {
    modal.style.display = "block";
    resolve("");
  });

  if (checkResult == 1) { // 마스크를 착용 하였을 때
    audio1.currentTime = 0;
    audio1.play();
    document.getElementById("text").innerHTML = "검사가 완료되었습니다.";
    document.getElementById("maskimg").src = maskimgsrc;
    
    await countmaskon();
    
    count = document.getElementsByClassName("count_1").innerHTML;
    count++;
    document.getElementsByClassName("count_1").innerHTML = count;
    
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        audio1.pause();
      }, 2000);
    });
  } else if (checkResult == 0) {//마스크 미착용 시
    audio2.currentTime = 0;
    audio2.play();
    document.getElementById("text").innerHTML = "마스크를 착용해주세요!";
    document.getElementById("maskimg").src = maskimgsrc;
    
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
      console.log("7_결과 출력 완료");
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