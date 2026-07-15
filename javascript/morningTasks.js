import { LocalNotifications } from '@capacitor/local-notifications';

await LocalNotifications.schedule({
  notifications: [
    {
      id: 1,
      title: "MorningTime",
      body: "通知テストです！",
      schedule: {
        at: new Date(Date.now() + 5000)
      }
    }
  ]
});



/* =====================
   毎朝の処理
===================== */

async function morningTask() {

    // ① 今日の6:00の天気取得
    const weather = await loadWeather("Niigata");

    // ② 出発時刻計算
    const result = getDeparttime(
        weather.rain,
        weather.snow
    );

    // ③ 計算結果保存
    localStorage.setItem("todayDeparture", result.departTime);
    localStorage.setItem("todayMemo", result.memo);

    // ④ 通知
    sendMorningNotification(result.departTime, result.memo);
}

const WEATHER_API_KEY = "27ffa0b68c8bf26b0a65348b565e1916";

async function loadWeather(city = "Niigata") {

  try {

    // 5日間 / 3時間ごとの予報
    const url =
      `https://api.openweathermap.org/data/2.5/forecast?q=${city},JP&appid=${WEATHER_API_KEY}&units=metric&lang=ja`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("天気取得失敗");
    }

    const data = await response.json();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

 
    const targetDate = `${yyyy}-${mm}-${dd} 06:00:00`;


    const todayData = data.list.find(item =>
      item.dt_txt === targetDate
    );

    if (!todayData) {
      throw new Error("天気データなし");
    }

    const weather =
      todayData.weather[0].description;
      console.log(todayData.weather[0]);

    const temp =
      Math.round(todayData.main.temp);
    const rain =
      todayData.rain?.["3h"] || 0;
    
    const snow =
      todayData.snow?.["3h"] || 0;
    
    console.log(rain);
    console.log(snow);

    if(rain>0){ 
      document.getElementById("home-weather").textContent =
      `🌧${weather}　${temp}℃`;
    }else　if(snow>0){
      document.getElementById("home-weather").textContent =
      `⛄${weather}　${temp}℃`;
    }else{

     // 表示
    /*document.getElementById("home-weather").textContent =
      `${weather}　${temp}℃`;
    document.getElementById("time-memo")  
       .textContent = "いつも通り\(^o^)/";*/
    }
    

    return {
      weather:weather,
      temperature:temp,
      rain: rain,
      snow: snow
    };
   
  } catch (error) {

    console.error(error);

    document.getElementById("home-weather").textContent =
      "天気情報を取得できませんでした";
  }
}

/* =====================
   出発時刻計算!!!!
   ===================== */
  function getDeparttime(rain,snow) {
    const depart = localStorage.getItem("depart");
    const trafficPoints =JSON.parse(localStorage.getItem("trafficPoints")) || [];
    const today = new Date();
    const [hour, minute] = depart.split(":");
    let delay=0;
    let traffic=1.0;
    let todayweather="";
    let departTime="";
    let memo="";
    
     //(雨 or 雪)
    if (rain>0 || snow>0) {
      let rainsnow=0;
      if(snow>0){
         rainsnow=snow/3; //1時間あたり降雪量
         delay=21.5;
         todayweather="雪";
      }else{
        rainsnow=rain/3; //1時間あたり降水量
        console.log(rainsnow);
        delay=8.9;
        todayweather="雨";
      }

      let rainfall =1.0;     //0-1mmは係数1.0
      today.setHours(hour);
      today.setMinutes(minute);
      today.setSeconds(0);

      if (rainsnow >= 2 && rainsnow < 5){  //2mm-5mmは係数1.1
        rainfall=1.1
      }
      else if(rainsnow>= 5){                //5mm以上は1.5
        rainfall=1.5
      }  

      if (trafficPoints.length > 0){        //混雑係数追加
        if (trafficPoints.includes("紫竹山")){
          traffic=1.5;
        }
        else if (trafficPoints.includes("栗ノ木バイパス")){
          traffic=1.1;
        }else{
          traffic=1.2;
        }
      }
      delay=delay*rainfall*traffic;
      delay = Math.round(delay);
      today.setMinutes(today.getMinutes() - delay);
      const todayhours = today.getHours();   
      const todayminutes =String(today.getMinutes()).padStart(2, "0");

      departTime=`${todayhours}:${todayminutes}`;
      memo=`${todayweather}のため${delay}分早い出発がおすすめ`;
      /*document.getElementById("home-departure")
        .textContent = `${todayhours}:${todayminutes}`;
    
      document.getElementById("time-memo")
      .textContent = `${todayweather}のため${delay}分早い出発がおすすめ`;*/
    }else{
      
      //実演用
   /*   delay=8.9*1.5;
      if (trafficPoints.length > 0){
        if (trafficPoints.includes("紫竹山")){
          traffic=1.5;
        }
        else if (trafficPoints.includes("栗ノ木バイパス")){
          traffic=1.1;
        }else{
          traffic=1.2;
        }
        delay=delay*traffic;
      }
      delay = Math.round(delay);
      console.log(trafficPoints);
      today.setHours(hour);
      today.setMinutes(minute);
      today.setSeconds(0);
      today.setMinutes(today.getMinutes() - delay);
      const todayhours = today.getHours();   
      const todayminutes =String(today.getMinutes()).padStart(2, "0");
      document.getElementById("home-departure")
        .textContent = `${todayhours}:${todayminutes}`;ここまで*/

    /* document.getElementById("home-departure")
    .textContent = `${hour}:${minute}`;*/
    departTime=`${hour}:${minute}`;
    memo="いつも通り\(^o^)/";
  }
  return {departTime,
        memo
  };
}

function sendMorningNotification(departTime,memo){

}