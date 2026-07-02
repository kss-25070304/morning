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
    const requiredFields = ["nickname", "departTime", "notifyTime"];

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
      const depart =
        localStorage.getItem("depart");

    
      const saveFlag = 
        localStorage.getItem("saveFlag");

      if (saveFlag) {
        location.href = "homeapp.html";
        return;
      }
        showScreen("screen-register");
    });

  
    /* =====================
       画面2 → 3：登録ボタン
    ===================== */
    document.getElementById("btn-register").addEventListener("click", () => {
      const nickname    = document.getElementById("nickname").value;
      const depart      = document.getElementById("departTime").value;
      const notify  = document.getElementById("notifyTime").value;
      // =====================
      // 保存
      // =====================
      localStorage.setItem("nickname", nickname);
      localStorage.setItem("depart", depart);
      localStorage.setItem("notify", notify);
      const selectedRoads = [];

      document
        .querySelectorAll('#screen-register input[type="checkbox"]:checked')
        .forEach(cb => {
          selectedRoads.push(cb.value);
        });

      localStorage.setItem(
        "trafficPoints",
        JSON.stringify(selectedRoads)
      );

      showScreen("screen-complete");
      localStorage.setItem("saveFlag", true);

  });

 
    /* =====================
       画面3 → 4：完了画面タップ
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

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

 
    const targetDate = `${yyyy}-${mm}-${dd} 06:00:00`;

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
     // { btn: "btn-arrival", target: "arrivalTime" },
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
   保存データをフォームに反映
===================== */
function restoreForm() {
  // ニックネーム
  const nickname = localStorage.getItem("nickname");
  if (nickname) {
    document.getElementById("nickname").value = nickname;
  }
 
  // 出発時間
  const depart = localStorage.getItem("depart");
  if (depart) {
    document.getElementById("departTime").value = depart;
    const tfVal = document.querySelector("#btn-depart .tf-val");
    tfVal.textContent = depart;
    tfVal.classList.remove("tf-placeholder");
  }
 
  //通知時間
  const notify = localStorage.getItem("notify");
  if (notify) {
    document.getElementById("notifyTime").value = notify;
    const tfVal = document.querySelector("#btn-notify .tf-val");
    tfVal.textContent = notify;
    tfVal.classList.remove("tf-placeholder");
  }
 
  // 利用道路
  const roadsJson = localStorage.getItem("trafficPoints");
  if (roadsJson) {
    const roads = JSON.parse(roadsJson);
    document
      .querySelectorAll('#screen-register input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = roads.includes(cb.value);
      });
  }
 
  // 登録ボタンの有効/無効を再チェック
  checkForm();
}
 
    /* =====================
       初期表示
    ===================== */
    //showScreen("screen-splash");
 
    const params = new URLSearchParams(location.search);
    if (params.get("screen") === "register") {
      restoreForm();
      showScreen("screen-register");
    } else {
      showScreen("screen-splash");
    }



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