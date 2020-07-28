  
const URL = "./my_model/";
    
let model, webcam, labelContainer, maxPredictions;
let checkLoop=0; // 전역변수로 체킹 변수 설정
let modal = document.getElementById("myModal");
var audio1 = new Audio("./검사가 완료되었습니다.mp3");
var audio2 = new Audio("./마스크를 착용해주세요.mp3");
var audio3 = new Audio("./마스크 착용은 필수입니다.mp3");
let maskimgsrc = "maskimg.png";
let checkResult; // 판정 값 check함수로부터의 반환값을 받아온다.
let stop =0; // stop 버튼 활성화 여부 0: 비활, 1 : 정지
let countMask=0; //마스크 쓴 사람들을 세리기 위한 변수
let countUnMask=0; // 마스크를 쓰지 않은 사람들을 세리기 위한 변수


//start 버튼 실행되면 start버튼 사라지게 
// +a 일시정지

async function init() { // start 버튼
    //우리가 만든 모델을 불러온다
    document.getElementById("BT_start").style.display='none'; //시작 버튼 안보이게 하기
    document.getElementById("BT_stop").style.display='block'; //판단 종료 버튼 보이게 하기

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true; 
    webcam = new tmImage.Webcam(400, 400, flip); // 웹캠 사이즈 조정
    await webcam.setup(); 
    await webcam.play(); //웹캠 재생

    window.requestAnimationFrame(loop); 
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container"); 
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}
async function stopPlay(){ // 정지 버튼을 누른다.
    stop=1; // stop 활성화
    webcam.stop(); //웹캠 정지
    document.getElementById("webcam-container").innerHTML = null; // 웹캠 띄운 화면을 안보이게 함
    console.log("플레이 정지!!!"); // 콘솔창에 띄워서 확인
    CheckResult=100; // 판단값을 변경
    predict();

}

async function loop() {
    await webcam.update(); 
    if(stop==1){
        checkLoop=200;
    }
    if(checkLoop==150){
        console.log("1_판단을 시작하지!");

        var check_predict = await predict(); // 이게 1이면 루프를 돌고 아니면 루프를 안돌게 해야함

        if(check_predict!==1){ //정지버튼을 눌렀을 때 함수 탈출을 하여 실행 정지
            return;
        }

        await webcam.play(); 
        console.log("8_Play!! DID!!!");

        checkLoop=0; // 시간 재는 용도의 checkLoop

        if(check_predict==1){
            window.requestAnimationFrame(loop); //순서 변경 x 
        }
    }
    else if(checkLoop<150){
        labelContainer.childNodes[0].innerHTML = "화면에 얼굴을 비춰주세요.";
        checkLoop++;
        console.log("1번 : 루프돌자 슝슝");
        window.requestAnimationFrame(loop); //순서 변경 x 
    }
}

/////////////////////예측 함수////////////////////////////

async function predict() { // 예측 진행 함수
    let count=0;
    console.log("2_predict 함수 실행");
    
    await webcam.pause(); 
    console.log("3_일시정지 완료");
    
    const prediction =  await model.predict(webcam.canvas);
    console.log("4_predict success"); 
    
    checkResult = await check(prediction); 
    //-1:stop,0:미착용,1:착용,100:불분명
    if(checkResult ==-1){ //정지를 눌렀을 경우
        count=0;
        return count;
    }
    
    console.log("checkResult값: "+checkResult);
    
    console.log("7_결과 출력 완료");
    await new Promise((resolve,reject) => {
        modal.style.display = "block";
        document.getElementById("text").innerHTML = checkResult;
        resolve("");
        //불분명할 경우
    });

    if(checkResult==1){
        audio1.currentTime = 0;
        audio1.play();
        document.getElementById("text").innerHTML = "검사가 완료되었습니다.";
        await new Promise((resolve,reject) => {
            setTimeout(() => {
                audio1.pause();
            }, 2000);
        });
    }else if(checkResult==0){
        audio2.currentTime = 0;
        audio2.play();
        document.getElementById("text").innerHTML ="마스크를 착용해주세요!";
        document.getElementById("maskimg").src = maskimgsrc;
        await new Promise((resolve,reject) => {
            setTimeout(() => {
                audio2.pause();
            }, 2000);
        });
        audio3.currentTime= 0;
        audio3.play();
        await new Promise((resolve,reject) => {
            setTimeout(() => {
                audio3.pause();
            }, 2000);
        });
    }else{
        document.getElementById("text").innerHTML = "다시 검사하겠습니다."; 
    }
    document.getElementById("countingMask").innerHTML=countMask;
    document.getElementById("countingUnMask").innerHTML=countUnMask;
    
    count=await new Promise((resolve,reject) => {
        setTimeout(() => {
            audio1.pause();
            modal.style.display = "none";
            resolve(1); 
         }, 1000);
    });
    return count;

    

}


function check(prediction){//predict()의 prediction배열을 파라미터로 받음
    console.log("5_check함수 실행");
    return new Promise(function(resolve,reject){
        
        if(stop==1){ // 정지 버튼을 눌렀을 경우 음수를 반환
            resolve(-1);
        }else if(prediction[0].className == "mask" && prediction[0].probability.toFixed(2)>=0.70){
            resolve(1);// 마스크를 착용시 1을 반환
            countMask++;
            console.log("6_착용");
        }else if(prediction[1].className == "no mask" && prediction[1].probability.toFixed(2)>=0.70){
            resolve(0); // 마스크를 미착용시에 0을 반환
            console.log("6_미착용"); 
            countUnMask++;
        }else{
            resolve(100); // 구별 불분명 시에 100을 반환
            console.log("6_불분명함");
        }
        reject(-100);
    });
}
   