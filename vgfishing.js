/**
 * フィッシングゲームのメイン処理
 */
class FishingGame
{
    currentScene = undefined;
    hardwareModel = undefined;

    /**
     * コンストラクタ
     * @param {number} width ゲーム画面の幅を指定します。
     * @param {number} height ゲート画面の高さを指定します。
     * @param {number} color ゲーム画面の背景色を指定します。
     */
    constructor(width, height, color) 
    {      
        document.getElementById("t1").innerHTML = "<div style=\"color:white\">Loading..</div>";

        const pixiApp = new PIXI.Application({
<<<<<<< HEAD
            width: 0, 
=======
            width: 0,
>>>>>>> remotes/origin/main
            height: 0,                       
            backgroundColor: 0,      
            resolution: 1,
            autoDensity: true
        })
        document.body.appendChild(pixiApp.view);


        //右クリックで出るメニューを非表示に
        pixiApp.view.addEventListener("contextmenu", function(e){
            e.preventDefault();
        }, false);
        
      
        //更新処理
        pixiApp.ticker.add((delta) => {
            if(this.currentScene){
              this.currentScene.update(delta);
            }
        });
                
        //使いやす場所に
        this.app = pixiApp;

        this.hardwareModel = new HardwareModel(this);

        // ロボットアームのインスタンスを作成
        this.robotArms = new RobotArms(this.hardwareModel);
        
        // リサイズイベントの登録
        window.addEventListener('resize', () => {this.resizeCanvas();});
        this.resizeCanvas(); 

        //ブラウザの種類を取得
        const browser = (function(ua) {
        if (/MSIE|Trident/.test(ua)) {
            return 'ie';
        } else if (/Edg/.test(ua)) {
            return 'edge';
        } else if (/Android/.test(ua)) {
            return 'android';
        } else if (/Chrome/.test(ua)) {
            return 'chrome';
        } else if (/(?:Macintosh|Windows).*AppleWebKit/.test(ua)) {
            return 'safari';
        } else if (/(?:iPhone|iPad|iPod).*AppleWebKit/.test(ua)) {
            return 'mobilesafari';
        } else if (/Firefox/.test(ua)) {
            return 'firefox';
        } else {
            return '';
        }
        }(window.navigator.userAgent));

      }

    /**
     * アセット読み込み
     */
    preload(){
        this.onload();//読み込み完了でonload()実行
    }

  //アセット読み込み後に実行される(今は空っぽ))
    onload = () => {};

    main() {
      document.getElementById("t1").innerHTML = "<div style=\"color:white\">Loading..</div>";
      //cssのidを設定
      this.app.view.id = "game-screen";    
      const robotArms = this.robotArms;
      const inputManager = new VPadInputManager(robotArms);
  
      this.onload = () => {
          const hardwareModel = this.hardwareModel;
          this.replaceScene(new MainScene(inputManager, hardwareModel));
      }
  
      //データのロード
      this.preload();  
    }

    /**
     * canvasのリサイズ処理
     */
    resizeCanvas(){
        const renderer = this.app.renderer;
    
        let canvasWidth;
        let canvasHeight;
    
        const rendererHeightRatio = renderer.height / renderer.width;
        const windowHeightRatio = window.innerHeight / window.innerWidth;
    
        // 画面比率に合わせて縦に合わせるか横に合わせるか決める
        if (windowHeightRatio > rendererHeightRatio) {//縦長
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerWidth * (renderer.height / renderer.width);
        } else {//横長
        canvasWidth = window.innerHeight * (renderer.width / renderer.height);
        canvasHeight = window.innerHeight;
        }
    
        this.app.view.style.width  = `${canvasWidth}px`;
        this.app.view.style.height = `${canvasHeight}px`;
    }

    /**
     *  シーンの置き換え
     * @param {MainScene} newScene 
     */
    replaceScene(newScene){
        if(this.currentScene){//現在のシーンを廃棄
          this.currentScene.destroy();
        }
        if(this.waitingScene){//waitingSceneもあれば廃棄
        this.waitingScene.destroy();
        this.isPushedScene = false;
        }
        this.app.stage.addChild(newScene);
        this.currentScene = newScene;
    }

    dispose() {
      const hardwareModel = this.hardwareModel;
      hardwareModel.dispose();
    }
}


/**
 * バーチャルパッドベース
 */
class VPadBase {
  
  pad = undefined;

  /**
   * コンストラクタ
   */
  constructor() {
    this.resizePadBase();
    window.addEventListener('resize', ()=>{this.resizePadBase();});
  }

  /**
   * パッドのリサイズ
   */
  resizePadBase() {
    let styleDisplay = "block";//ゲームパッド対策
    if(this.pad != undefined){
      styleDisplay = this.pad.style.display;//ゲームパッド対策
      while(this.pad.firstChild){
        this.pad.removeChild(this.pad.firstChild);
      }
      this.pad.parentNode.removeChild(this.pad);
    }

    const screen = document.getElementById("game-screen");//ゲーム画面
  
    //HTMLのdivでvpad作成
    const pad = document.createElement('div');
    document.body.appendChild(pad);
    this.pad = pad;
    pad.id = "pad";
    pad.style.width = screen.style.width;
    pad.style.display = styleDisplay;

    //タッチで拡大とか起こるのを防ぐ
    pad.addEventListener("touchstart", (e) => {
      e.preventDefault();
    });
    pad.addEventListener("touchmove", (e) => {
      e.preventDefault();
    });

    let direction;
    //横長の場合位置変更
    if(window.innerWidth > window.innerHeight){
      pad.style.width = `${window.innerWidth}px`;
      pad.style.innerWidth = window.innerWidth;
      pad.style.position = "absolute";//画面の上にかぶせるため
      pad.style.backgroundColor = "transparent";//透明
      pad.style.bottom = "0";//下に固定
      direction = "horizon";
    }
    else {
      direction = "vertical";
      pad.style.innerWidth = window.innerWidth;
      pad.style.bottom = "0";//下に固定
    }

    const height = Number(screen.style.height.split('px')[0]) * 0.5;//ゲーム画面の半分の高さをゲームパッドの高さに
    pad.style.height = `${height}px`;
    this.height = height;
  }
}


/**
 * バーチャルパッドのクラス
 */
class Vpad {
    #_descriptor = "";
    #_vpadBase = null;
    #_buttonKey = false;

    /**
     *  コンストラクタ
     * @param {VPadBased} vpadBase バーチャルバッドのベースのインスタンスを指定します。
     * @param {InputManager} input 入力管理クラスのインスタンスを指定します。
     * @param {string} descriptor 識別子を指定します。
     * @param {bool} buttonKey ボタンのキーを指定します。
     */
    constructor(vpadBase, input, descriptor, buttonKey){
      this.#_descriptor = descriptor;
      this.#_vpadBase = vpadBase;
      this.#_buttonKey = buttonKey;
      this.input = input;      //InputManagerのinput
      this.resizePad();
      // リサイズイベントの登録
      window.addEventListener('resize', ()=>{this.resizePad();});
    }

    /**
     * パッドのリサイズ
     * @note 画面サイズが変わるたびにvpadも作り変える
     */
    resizePad(){
      const vpad = this.#_vpadBase;
      const pad = vpad.pad;

      let direction;
      //横長の場合位置変更
      if(window.innerWidth > window.innerHeight){
        direction = "horizon";
      }
      else {
        direction = "vertical";
      }
      
      //方向キー作成
      this.leftPad = new DirKey(pad, this.input, vpad.height, direction, this.#_descriptor);

      const buttonKey = this.#_buttonKey;
      if (!buttonKey) return;

      //Stopボタン作成
      const style = {
        width: `${vpad.height * 0.3}px`,
        height: `${vpad.height * 0.15}px`,
        right: `${vpad.height * 0.75}px`,
        top: `${vpad.height * 0.05}px`,
        borderRadius: `${vpad.height * 0.15 * 0.5}px`
      }

      this.startKey = new ActBtn(pad, this.input, "Stop", "Stop", style);

      const resetButtonStyle = {
        width: `${vpad.height * 0.25}px`,
        height: `${vpad.height * 0.25}px`,
        right: `${vpad.height * 0.01}px`,
        top: `${vpad.height * 0.005}px`,
        borderRadius: `${vpad.height * 0.15 }px`
      }

      this.resetKey = new ActBtn(pad, this.input, "A", "Home", resetButtonStyle);
    }
}
  
  /**
   * 方向キークラス
   */
class DirKey {

    /**
     *  コンストラクタ
     * @param {*} parent 
     * @param {*} input 
     * @param {*} padHeight 
     * @param {*} direction 
     * @param {*} alignment 
     */
     constructor(parent, input, padHeight, direction, alignment) {
      this.isTouching = false;
      this.originX = 0;
      this.originY = 0;
      this.input = input;
      let offset;

      //HTMLのdivでキーのエリアを作成
      const div = document.createElement('div');
      parent.appendChild(div); 
      div.className = "dir-key";
      div.style.innerWidth = padHeight * 0.8;
      div.style.width = div.style.height = `${padHeight * 0.8}px`;
      div.style.left = `${padHeight * 0.05}px`;
      div.style.top = `${padHeight * 0.1}px`;
      this.maxRadius = padHeight * 0.15;//中心移動させる半径
      this.emptySpace = padHeight * 0.05;//あそび

      if (alignment == "left")
      {
        div.style.marginLeft = 0;
        offset = `${parent.style.innerWidth - div.style.innerWidth}px`;
      }
      else
      {
        const marginRight = screen.width * ((direction == "vertical") ? 0.2 : 0.03);
        div.style.marginLeft = `${parent.style.innerWidth - div.style.innerWidth - marginRight}px`;
      }

      this.alignment = alignment;

      //十字キーのボタン(張りぼて。タッチイベントはない)
      const up = document.createElement('div');
      up.className = "dir up";
      div.appendChild(up);
      const left = document.createElement('div');
      left.className = "dir left";
      div.appendChild(left);
      const right = document.createElement('div');
      right.className = "dir right";
      div.appendChild(right);
      const down = document.createElement('div');
      down.className = "dir down";
      div.appendChild(down);
      const mid = document.createElement('div');
      mid.className = "dir mid";
      div.appendChild(mid);
      const circle = document.createElement('div');
      circle.className = "circle";
      mid.appendChild(circle);
      
      //タッチイベント
      div.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.isTouching = true;    
        //タッチした位置を原点にする
        this.originX = e.targetTouches[0].clientX;
        this.originY = e.targetTouches[0].clientY;
      });
  
      div.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if(!this.isTouching) return;
        dirReset();//からなず一度リセット
        
        //タッチ位置を取得
        const posX = e.targetTouches[0].clientX;
        const posY = e.targetTouches[0].clientY;
  
        //原点からの移動量を計算
        let vecY = posY - this.originY;
        let vecX = posX - this.originX;
        let vec = Math.sqrt(vecX * vecX + vecY * vecY);
        if(vec < this.emptySpace)return;//移動が少ない時は反応しない(遊び)
  
        const rad = Math.atan2(posY - this.originY, posX - this.originX);
        const y = Math.sin(rad);
        const x = Math.cos(rad);
  
        //移動幅が大きいときは中心を移動させる
        if(vec > this.maxRadius){
          this.originX = posX - x * this.maxRadius;
          this.originY = posY - y * this.maxRadius;
        }
       
        const abs_x = Math.abs(x);
        const abs_y = Math.abs(y);
        if(abs_x > abs_y){//xの方が大きい場合左右移動となる
          if(x < 0){//マイナスであれば左
            input.keys.Left = true;
          }else{
            input.keys.Right = true;
          }
          if(abs_x <= abs_y * 2){//2yがxより大きい場合斜め入力と判断
            if(y < 0){//マイナスであれば上
              input.keys.Up = true;
            }else{
              input.keys.Down = true;
            }
          }
        }else{//yの方が大きい場合上下移動となる
          if(y < 0){//マイナスであれば上
            input.keys.Up = true;
          }else{
            input.keys.Down = true;
          }
          if(abs_y <= abs_x * 2){//2xがyより大きい場合斜め入力と判断
            if(x < 0){//マイナスであれば左
              input.keys.Left = true;
            }else{
              input.keys.Right = true;
            }
          }
        }    
      });
      
      div.addEventListener("touchend", (e) => {
        dirReset();
      });
  
      const dirReset = () => {
        this.input.keys.Right = this.input.keys.Left = this.input.keys.Up = this.input.keys.Down = false;
      }
    }
  }
  
//アクションボタンクラス
class ActBtn {
  constructor(parent, input, key, name, style) {
    //HTMLのdivでボタンを作成
    const div = document.createElement('div');
    div.className = "button";
    parent.appendChild(div);
    div.style.width = style.width;
    div.style.height = style.height;
    div.style.right = style.right;
    div.style.top = style.top;
    div.style.borderRadius = style.borderRadius;

    //ボタン名を表示
    const p = document.createElement('p');
    p.innerHTML = name;
    div.appendChild(p);

    //タッチスタート
    div.addEventListener("touchstart", (e) => {
      e.preventDefault();
      input.keys[key] = true;
    });
    
    //タッチエンド
    div.addEventListener("touchend", (e) => {
      input.keys[key] = false;
    });
  }
}

/**
 * Graphicsにupdate機能追加
 * いくつかの図形をすぐかけるようにした
 * @extends PIXI.Graphics
 */
class Graphics extends PIXI.Graphics {

    /**
     * コンストラクタ
     */
    constructor(){
      super();
      this.isUpdateObject = true;
      this.isDestroyed = false;
      this.age = 0; 
    }

    /**
     * 破棄
     */
    destroy() {
      super.destroy();
      this.isDestroyed = true;
    }

    /**
     *  更新処理
     * @param {*} delta 
     */
    update(delta){
      this.age++;
    }

    /**
     * 線を引く
     * @param {number} x 開始点のＸ座標を指定します。
     * @param {number} y 開始点のＹ座標を指定します。
     * @param {number} x2 終了点のＸ座標を指定します。
     * @param {number} y2 終了点のＹ座標を指定します。
     * @param {number} thickness 線の太さを指定します。
     * @param {number} color 線の色を指定します。
     */
    line(x, y, x2, y2, thickness, color){
      this.lineStyle(thickness, color);
      this.moveTo(x, y);
      this.lineTo(x2, y2);
      this.lineStyle();//解除(他のにも影響がでるため) 
    }

    rectFill(x, y, w, h, color){
      this.beginFill(color);
      this.drawRect(x, y, w, h);
      this.endFill();
    }
    rect(x, y, w, h, thickness, color){
      this.lineStyle(thickness, color, 1, 0);
      this.drawRect(x, y, w, h);
      this.lineStyle();
    }
    circFill(x, y, radius, color){
      this.beginFill(color);
      this.drawCircle(x, y, radius);
      this.endFill();
    }
    circ(x, y, radius, thickness, color){
      this.lineStyle(thickness, color, 1, 0);
      this.drawCircle(x, y, radius);
      this.lineStyle();
    }
    //星型または正多角形のデータ計算用
    makeStarData(x, y, points, outerRadius, innerRadius){
      if(points < 3){//3未満は空の配列を返す(何も表示されない)
        return [];
      }
      let step = (Math.PI * 2) / points;//角度
      let halfStep = step / 2;
      const data = [];
      let dx, dy;
  
      const halfPI = Math.PI/2;//起点を90度ずらしたいので
      for (let n = 1; n <= points; ++n) {
        if(innerRadius){
          dx = x + Math.cos(step * n - halfStep - halfPI) * innerRadius;
          dy = y + Math.sin(step * n - halfStep - halfPI) * innerRadius;
          data.push(dx, dy);
        }      
        dx = x + Math.cos(step * n - halfPI) * outerRadius;
        dy = y + Math.sin(step * n - halfPI) * outerRadius;
        data.push(dx, dy);
      }
      return data;
    }
    starFill(x, y, points, outerRadius, innerRadius, color){
      this.beginFill(color);
      this.drawPolygon(this.makeStarData(x, y, points, outerRadius, innerRadius));
      this.endFill();
    }
    star(x, y, points, outerRadius, innerRadius, thickness, color){
      this.lineStyle(thickness, color, 1, 0);
      this.drawPolygon(this.makeStarData(x, y, points, outerRadius, innerRadius));
      this.lineStyle();
    }
    regPolyFill(x, y, points, radius, color){
      this.beginFill(color);
      this.drawPolygon(this.makeStarData(x, y, points, radius));
      this.endFill();
    }
    regPoly(x, y, points, radius, thickness, color){
      this.lineStyle(thickness, color, 1, 0);
      this.drawPolygon(this.makeStarData(x, y, points, radius));
      this.lineStyle();
    }
}

  /*********************************
 * PIXI.Containerにupdate機能を追加
 *********************************/
class Container extends PIXI.Container {
    constructor(){
      super();
      this.isUpdateObject = true;
      this.isDestroyed = false;
      this.objectsToUpdate = [];
      this.age = 0; 
    }
    //メインループで更新処理を行うべきオブジェクトの登録
    registerUpdatingObject(object) {
      this.objectsToUpdate.push(object);
    }
    //更新処理を行うべきオブジェクトを更新する
    updateRegisteredObjects(delta) {
      const nextObjectsToUpdate = [];
      for (let i = 0; i < this.objectsToUpdate.length; i++) {
        const obj = this.objectsToUpdate[i];
        if (!obj || obj.isDestroyed) {
          continue;
        }
        obj.update(delta);
        nextObjectsToUpdate.push(obj);
      }
      this.objectsToUpdate = nextObjectsToUpdate;
    }
    addChild(obj){
      super.addChild(obj);
      if(obj.isUpdateObject){//フラグを持っていれば登録
        this.registerUpdatingObject(obj);
      }
    }
    removeChild(obj){//取り除く処理
      super.removeChild(obj);
      obj.isDestroyed = true;//破壊と同じにした
    }
    destroy() {
      super.destroy();
      this.isDestroyed = true;
    }
    update(delta){
      this.updateRegisteredObjects(delta);
      this.age++;
    }
}

/**
 * バーチャルパッドの入力マネージャクラス
 */
class VPadInputManager {

  /**
   * コンストラクタ
   * @param {VPadInputManager} inputManager  バーチャルパッドの入力マネージャのインスタンスを指定します。
   */
  constructor(inputManager) {
    const pad = new VPadBase();
    this.inputLeft = new InputManager(pad, "left", inputManager.leftPadControlModel, false);
    this.inputRight = new InputManager(pad, "right", inputManager.rightPadControlModel, true);
  }
}

/**
 * 入力マネージャクラス
 */
class InputManager {
  #_descriptor = "";

  /**
   * コンストラクタ
   * @param {VPadBase} pad 
   * @param {string} descriptor 
   * @param {PadControllerModel} padControlModel 
   * @param {bool} buttonKey
   */
  constructor(pad, descriptor, padControlModel, buttonKey) {
    this.#_descriptor = descriptor;
    this.padControlModel = padControlModel;

    //方向入力チェック用定数
    this.keyDirections = {
      UP: 1,
      UP_RIGHT: 3,
      RIGHT: 2,
      DOWN_RIGHT: 6,
      DOWN: 4,
      DOWN_LEFT: 12,
      LEFT: 8,
      UP_LEFT: 9,
      NOTE : 10,
    };
    //キーの状態管理定数
    this.keyStatus = {
      HOLD: 2,
      DOWN: 1,
      UNDOWN: 0,
      RELEASE: -1,
    };
    //キーの状態管理用変数
    this.input = {
      //入力されたキーのチェック用
      keys: {
        Up: false,
        Right: false,
        Down: false,
        Left: false,
        A: false,
        B: false,
        Stop: false
      },
      //一つ前のキーの状態管理用
      keysPrev: {
        Up: false,
        Right: false,
        Down: false,
        Left: false,
        A: false,
        B: false,
        Stop: false
      },
   };


   //スマホ・タブレットの時だけv-pad表示
    if (navigator.userAgent.match(/iPhone|iPad|Android/)) {
      document.getElementById("t1").innerHTML = "";
<<<<<<< HEAD
      this.vpad = new Vpad(pad, this.input, descriptor, buttonKey);
    }
=======
      this.vpad = new Vpad(pad, this.input, descriptor);
      }
>>>>>>> remotes/origin/main
    else {
      document.getElementById("t1").innerHTML = "<div style=\"color: white;\">スマホでアクセスして下さい。</div>";
    }
  }

  /**
   * 名前を取得します。
   */
  get name() {
    return this.#_descriptor;
  }

  /**
   * 方向キーの状態をチェックして返します。
   * @returns {number} 方向キーの状態を返します。
   */
  checkDirection() {
    let direction = 0;//初期化
    if(this.input.keys.Up){
        direction += this.keyDirections.UP;
    }
    if(this.input.keys.Right){
      direction += this.keyDirections.RIGHT;
    }
    if(this.input.keys.Down){
      direction += this.keyDirections.DOWN;
    }
    if(this.input.keys.Left){
      direction += this.keyDirections.LEFT;
    }
    return direction;
  }

//ボタンの入力状態をチェックして返す

  /**
   * ボタンの状態をチェックして返します。
   * @param {string} key ボタンの名前を指定します。
   * @returns {number} ボタンの状態を返します。
   */
  checkButton(key) {
      if(this.input.keys[key]){
        if(this.input.keysPrev[key] == false){
          this.input.keysPrev[key] = true;
          return this.keyStatus.DOWN;//押されたとき
        }
        return this.keyStatus.HOLD;//押しっぱなし
      }else{
        if(this.input.keysPrev[key] == true){
          this.input.keysPrev[key] = false;
          return this.keyStatus.RELEASE;//ボタンを離した時
        }
        return this.keyStatus.UNDOWN;//押されていない
      }
  }

  /**
   * 左パッドの入力管理オブジェクトか評価します。
   * @returns {boolean} 左パッドの場合はtrueを返却する。
   */
  isLeft() {
    return (this.#_descriptor === "left");
  }

  /**
   * 右パッドの入力管理オブジェクトか評価します。
   * @returns {boolean} 右パッドの場合はtrueを返却する。
   */
  isRight() {
    return (this.#_descriptor === "right");
  }
}


