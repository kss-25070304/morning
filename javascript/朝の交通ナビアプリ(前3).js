    /* =====================
       画面遷移ユーティリティ
    ===================== */
    function showScreen(id) {
      // 全画面を非表示
      document.querySelectorAll(".screen").forEach(s => {
        s.classList.remove("visible");
        setTimeout(() => {
          if (!s.classList.contains("active")) {
            s.style.display = "none";
          }
        }, 700);
        s.classList.remove("active");
      });

      const next = document.getElementById(id);

      // register は overflow-y スクロール対応で display:block
      if (id === "screen-register" || id === "screen-home") {
        next.style.display = "flex";
      } else {
        next.style.display = "flex";
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          next.classList.add("active", "visible");
        });
      });
    }

    /* =====================
       画面2：フォームバリデーション
    ===================== */
    const requiredFields = ["nickname", "origin", "destination", "departTime", "arrivalTime", "notifyTime"];

    function checkForm() {
      const allFilled = requiredFields.every(id => document.getElementById(id).value.trim() !== "");
      document.getElementById("btn-register").disabled = !allFilled;
    }

    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener("input", checkForm);
      el.addEventListener("change", checkForm);
      el.addEventListener("blur", () => {
        const errEl = document.getElementById("err-" + id);
        if (el.value.trim() === "") {
          el.classList.add("error");
          if (errEl) errEl.classList.add("show");
        } else {
          el.classList.remove("error");
          if (errEl) errEl.classList.remove("show");
        }
      });
    });

    /* =====================
       画面1 → 2：スプラッシュタップ
    ===================== */
    document.getElementById("screen-splash").addEventListener("click", () => {
    const origin =
      localStorage.getItem("origin");

    const destination =
      localStorage.getItem("destination");

    const depart =
      localStorage.getItem("depart");

    const arrival =
      localStorage.getItem("arrival");

    const saveFlag = 
      localStorage.getItem("saveFlag");

    if (saveFlag) {
      location.href = "home.html";
      return;
    }
      showScreen("screen-register");
    });

    /* =====================
       Google Maps / Directions
    ===================== */
    let googleMap = null;
    let directionsRenderer = null;

    function initMap() {

  // マップオブジェクト生成（初回のみ）
  if (googleMap) return;

  googleMap = new google.maps.Map(
    document.getElementById("map"),
    {
      zoom: 13,
      center: { lat: 37.9, lng: 139.0 },
      disableDefaultUI: true,
      zoomControl: true,
    }
  );

  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: false,
    draggable: true,
    polylineOptions: {
      strokeColor: "#0b4cc9",
      strokeWeight: 5
    }
  });

  directionsRenderer.setMap(googleMap);
}

    function searchRoute(origin, destination, departureTime) {
      document.getElementById("map-loading").style.display = "flex";
      document.getElementById("map-error").style.display = "none";

      initMap();

      // 入力された出発時間をDateオブジェクトに変換（今日の日付で設定）
      let depDate = new Date();
    //  depDate.setDate(depDate.getDate() + 1);
      if (departureTime) {
        const [h, m] = departureTime.split(":").map(Number);
        depDate.setHours(h, m, 0, 0);
        if (depDate < new Date()) {
    depDate.setDate(depDate.getDate() + 1);
  }

      }

      
      console.log(depDate);
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        //avoidHighways: travelMode !== "highway",
        drivingOptions: {
        departureTime: depDate,
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      },
      }, function(result, status) {
        document.getElementById("map-loading").style.display = "none";
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const route = result.routes[0].legs[0];
          //console.log(result.routes[0].legs[0].steps);
          //console.log("距離:", route.distance.text);
          // 渋滞考慮の所要時間があればそちらを優先表示
          const duration = route.duration_in_traffic
            ? route.duration_in_traffic.text
            : route.duration.text;
          document.getElementById("map-distance").textContent = route.distance.text;
        } else {
          const errEl = document.getElementById("map-error");
          errEl.style.display = "flex";
          errEl.textContent = "ルートの取得に失敗しました（" + status + "）\n出発地点・通勤先をご確認ください";
          document.getElementById("map-duration").textContent = "--";
          document.getElementById("map-distance").textContent = "--";
          console.log(origin, destination);
          console.log(status);
        }
      });
    }

    /* =====================
       画面2 → 3：登録ボタン
    ===================== */
    document.getElementById("btn-register").addEventListener("click", () => {
      const nickname    = document.getElementById("nickname").value;
      const origin      = document.getElementById("origin").value + ",新潟県";
      const destination = document.getElementById("destination").value + ",新潟県";
      const depart      = document.getElementById("departTime").value;
      const arrival     = document.getElementById("arrivalTime").value;

    // =====================
    // 保存
    // =====================
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("origin", origin);
    localStorage.setItem("destination", destination);
    localStorage.setItem("depart", depart);
    localStorage.setItem("arrival", arrival);
    

      showScreen("screen-map");

      // 画面遷移アニメ完了後に地図を初期化・ルート検索
      setTimeout(() => searchRoute(origin, destination, depart), 750);
    });

    /* =====================
       画面3 → 4：登録完了ボタン　　ここで混雑地点を登録
    ===================== */
    document.getElementById("btn-map-complete").addEventListener("click", () => {
      const result = directionsRenderer.getDirections();
      const routePath = [];

      result.routes[0].legs[0].steps.forEach(step => {
        step.path.forEach(point => {
          routePath.push(point);
        });
      });

      const mytrafficPoints = [];
      const trafficPoints = [
              { name: "紫竹山",
                polygon:[
                  {lat:37.899887, lng:139.068724},
                  {lat:37.897107, lng:139.071019},
                  {lat:37.899662, lng:139.072309},
                  {lat:37.901845, lng:139.075647},
                  {lat:37.902418, lng:139.073668}
                ],coefficient: 1.20 },
              { name: "桜木", lat: 37.895572, lng:139.052564, coefficient: 1.20 },
              { name: "弁天", lat: 37.899433, lng:139.066879, coefficient: 1.20 },
              { name: "女池", lat: 37.887882, lng:139.033024, coefficient: 1.20 },
              { name: "竹尾", lat: 37.912260, lng:139.097995, coefficient: 1.20 },
              { name: "逢谷内",lat:37.917962, lng:139.118484, coefficient: 1.20 },
              { name: "黒崎", lat: 37.877122, lng:139.015055, coefficient: 1.20 },
              { name: "海老ケ瀬",lat:37.921692, lng:139.127018,coefficient: 1.20},
              { name: "姥ヶ山",lat:37.879791, lng:139.079351, coefficient: 1.20},
              { name: "栗ノ木バイパス",lat:37.911492, lng:139.072402,coefficient:1.20} ];

      routePath.forEach(routePoint => {
        trafficPoints.forEach(tp => {

          // 紫竹山はエリア判定
          if (tp.polygon) {
            const polygon = new google.maps.Polygon({
              paths: tp.polygon
            });
            if (
              google.maps.geometry.poly.containsLocation(routePoint, polygon)
            ) {
              mytrafficPoints.push(tp.name);
            }
          }
          // その他は100m以内判定
          else {
            const tpLatLng = new google.maps.LatLng(tp.lat, tp.lng);
            const distance =
              google.maps.geometry.spherical.computeDistanceBetween(
                routePoint,
                tpLatLng
              );
            if (distance <= 100) {
              mytrafficPoints.push(tp.name);
            }
          }
        });
      });
      console.log(result.routes[0].legs[0].steps);
      const uniqueTrafficPoints = [...new Set(mytrafficPoints)];
      localStorage.setItem(
        "trafficPoints",
        JSON.stringify(uniqueTrafficPoints)
      );
      showScreen("screen-complete");
      localStorage.setItem("saveFlag", true);
    });

    /* =====================
       画面4 → 5：完了画面タップ
    ===================== */
    document.getElementById("screen-complete").addEventListener("click", () => {

  const depart = document.getElementById("departTime").value;

  document.getElementById("home-departure").textContent = depart || "--:--";

  document.getElementById("home-date").textContent = getTomorrowText();


  // 天気取得
  loadWeather("Niigata");

  showScreen("screen-home");
});
    


    /* =====================
       日付テキスト生成
    ===================== */
    

    function getTomorrowText() {

    const d = new Date();
      const days = ["日","月","火","水","木","金","土"];
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`;
 
    }

   /* =====================
   天気取得
   ===================== */

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

    // 明日の12時のデータを探す
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

 
    const targetDate = `${yyyy}-${mm}-${dd} 06:00:00`;


    // 明日の昼12時の天気
    const tomorrowData = data.list.find(item =>
      item.dt_txt === targetDate
    );

    if (!tomorrowData) {
      throw new Error("明日の天気データなし");
    }

    const weather =
      tomorrowData.weather[0].description;

    const temp =
      Math.round(tomorrowData.main.temp);

    // 表示
    document.getElementById("home-weather").textContent =
      `明日：${weather}　${temp}℃`;

  } catch (error) {

    console.error(error);

    document.getElementById("home-weather").textContent =
      "天気情報を取得できませんでした";
  }
}

    /* ============================
       時計ピッカー
    ============================ */
    const overlay = document.getElementById("clock-overlay");
    const face    = document.getElementById("clock-face");
    const segHour = document.getElementById("seg-hour");
    const segMin  = document.getElementById("seg-min");

    let pickHour = 7, pickMin = 0;
    let clockMode  = "hour";  // "hour" | "min"
    let isDragging = false;
    let currentTargetId = null;  // 書き込み先 hidden フィールドの id
    let currentBtnId    = null;  // 表示を更新するボタンの id

    const clockLabels = {
      departTime:  "出発時間の目安",
      arrivalTime: "到着時間の目安",
      notifyTime:  "通知時刻",
    };

    function openClock(targetId, btnId) {
      currentTargetId = targetId;
      currentBtnId    = btnId;

      // 既存値があれば初期値に反映
      const existing = document.getElementById(targetId).value;
      const m = existing.match(/^(\d{1,2}):(\d{2})$/);
      pickHour = m ? parseInt(m[1]) : 7;
      pickMin  = m ? parseInt(m[2]) : 0;

      document.getElementById("clock-title").textContent = clockLabels[targetId] || "時間を選択";
      clockMode = "hour";
      renderClock();
      overlay.classList.add("open");
    }

    function closeClock() { overlay.classList.remove("open"); }

    // 3つのボタンにイベント登録
    [
      { btn: "btn-depart",  target: "departTime"  },
      { btn: "btn-arrival", target: "arrivalTime" },
      { btn: "btn-notify",  target: "notifyTime"  },
    ].forEach(({ btn, target }) => {
      document.getElementById(btn).addEventListener("click", () => openClock(target, btn));
    });

    document.getElementById("clock-cancel").addEventListener("click", closeClock);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeClock(); });

    document.getElementById("clock-ok").addEventListener("click", () => {
      const hh = String(pickHour).padStart(2,"0");
      const mm = String(pickMin).padStart(2,"0");
      const timeStr = `${hh}:${mm}`;

      // hidden フィールドに値を保存
      document.getElementById(currentTargetId).value = timeStr;

      // ボタン表示を更新
      const tfVal = document.querySelector(`#${currentBtnId} .tf-val`);
      tfVal.textContent = timeStr;
      tfVal.classList.remove("tf-placeholder");

      // エラー表示を消す
      const errEl = document.getElementById("err-" + currentTargetId);
      if (errEl) errEl.classList.remove("show");

      checkForm();
      closeClock();
    });

    segHour.addEventListener("click", () => { clockMode = "hour"; renderClock(); });
    segMin.addEventListener("click",  () => { clockMode = "min";  renderClock(); });

    /* ── 時計盤の描画 ── */
    function renderClock() {
      face.innerHTML = "";
      const R = face.offsetWidth / 2 || 105;

      // 選択値（表示用）
      const selectedVal = clockMode === "hour"
        ? (pickHour % 12 === 0 ? 12 : pickHour % 12)
        : Math.round(pickMin / 5) * 5 % 60;

      // 針
      const val      = clockMode === "hour" ? (pickHour % 12) : pickMin;
      const total    = clockMode === "hour" ? 12 : 60;
      const angle    = (val / total) * 360;
      const needleLen = R * 0.62;
      const needle = document.createElement("div");
      needle.className = "clock-needle-line";
      needle.style.cssText = `height:${needleLen}px; transform:translateX(-50%) rotate(${angle}deg);`;
      face.appendChild(needle);

      // 中心ドット
      const center = document.createElement("div");
      center.className = "clock-center-dot";
      face.appendChild(center);

      // 数字と選択ドット
      const labelR = R * 0.77;
      const nums = clockMode === "hour"
        ? [12,1,2,3,4,5,6,7,8,9,10,11]
        : [0,5,10,15,20,25,30,35,40,45,50,55];

      nums.forEach((n, i) => {
        const theta = ((i / 12) * 360 - 90) * (Math.PI / 180);
        const x = R + labelR * Math.cos(theta);
        const y = R + labelR * Math.sin(theta);

        if (n === selectedVal) {
          const dot = document.createElement("div");
          dot.className = "clock-selected-dot";
          dot.style.left = x + "px";
          dot.style.top  = y + "px";
          face.appendChild(dot);
        }

        const lbl = document.createElement("div");
        lbl.className = "clock-num" + (n === selectedVal ? " selected" : "");
        lbl.textContent = clockMode === "hour" ? n : String(n).padStart(2,"0");
        lbl.style.left = x + "px";
        lbl.style.top  = y + "px";
        face.appendChild(lbl);
      });

      // デジタル表示更新
      segHour.textContent = String(pickHour).padStart(2,"0");
      segMin.textContent  = String(pickMin).padStart(2,"0");
      segHour.className = "clock-seg" + (clockMode === "hour" ? " active" : "");
      segMin.className  = "clock-seg" + (clockMode === "min"  ? " active" : "");
    }

    /* ── ドラッグ操作 ── */
    function getAngleFromEvent(e, el) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const pt = e.touches ? e.touches[0] : e;
      let deg = Math.atan2(pt.clientY - cy, pt.clientX - cx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;
      return deg;
    }

    function applyAngle(deg) {
      if (clockMode === "hour") {
        const h = Math.round(deg / 30) % 12;
        pickHour = h === 0 ? 12 : h;
      } else {
        pickMin = Math.round(deg / 30) * 5 % 60;
      }
      renderClock();
    }

    function onPointerDown(e) { isDragging = true; applyAngle(getAngleFromEvent(e, face)); }
    function onPointerMove(e) { if (!isDragging) return; e.preventDefault(); applyAngle(getAngleFromEvent(e, face)); }
    function onPointerUp()    { if (!isDragging) return; isDragging = false; if (clockMode === "hour") { clockMode = "min"; renderClock(); } }

    //face.addEventListener("touchstart", onPointerDown, { passive: false });
    //face.addEventListener("touchmove",  onPointerMove, { passive: false });
    //face.addEventListener("touchend",   onPointerUp,   { passive: true  });

    face.addEventListener("mousedown",  onPointerDown);
    face.addEventListener("mousemove",  onPointerMove);
    face.addEventListener("mouseup",    onPointerUp);
    
    face.addEventListener("touchstart", onPointerDown, { passive: false });
    face.addEventListener("touchmove",  onPointerMove, { passive: false });
    face.addEventListener("touchend",   onPointerUp,   { passive: true  });
    document.addEventListener("mouseup", () => { isDragging = false; });

    //保存されていたら

    /* =====================
    保存データ読み込み
    ===================== */

window.addEventListener("load", () => {

  const savedOrigin =
    localStorage.getItem("origin");

  const savedDestination =
    localStorage.getItem("destination");

  const savedDepart =
    localStorage.getItem("depart");

  const savedArrival =
    localStorage.getItem("arrival");

  const saveFlag =
    localStorage.getItem("saveFlag");

  if (saveFlag == true) {
    location.href = "home.html";
  }

  // ボタン有効化チェック
  checkForm();

});

    /* =====================
       初期表示
    ===================== */
    showScreen("screen-splash");

    google.maps.event.addListener(
      directionsRenderer,
      "directions_changed",
      function() {

        const directions = directionsRenderer.getDirections();

        console.log(directions);

      }
    );


self.addEventListener("install", event => {
});

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("./service-worker.js")
    .then(() => {
      console.log("PWA登録成功");
    })
    .catch(err => {
      console.log(err);
    });

}