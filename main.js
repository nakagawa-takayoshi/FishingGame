/**
 * @file main.js
 */

/**
 * 設定用データ
 */
const Config = {
    /** 画面階層度 */
    Screen: {
      Width: 256,//幅
      Height: 256,//高さ
      BackGroundColor: 0xffffff,//背景色
    },

  }

const LiveViewImage = "<img style=\"position: absolute; margin-left: -150px;\" src=\"https://www.givetakewinwin.com/cam_image.png\"/>";

/**
 * @classdesc メインアプリケーションクラス
 */
class MainApp {

  game = null;

  /**
   * メイン関数
   */
  static main() {
    const app = new MainApp();
  }

  /**
   * コンストラクタ
   */
  constructor() {
    window.onload = () => this.onloadWindow();
    window.onunload = () => game.dispose();    
  }

  /**
   * ウィンドウのロードが完了した時に呼ばれるイベント
   */
  onloadWindow() {
    this.game = new FishingGame(Config.Screen.Width, Config.Screen.Height, Config.Screen.BackGroundColor);
  }
}

// ここからプログラムが開始
MainApp.main();

/**
 * @classdesc メインシーンクラス
 * @extends {Container} 
 */
class MainScene extends Container {
  #Prop = {

    leftKeys: {
      Up : false,
      Down: false,
      Left: false,
      Right : false,
    },

    rightKeys: {
      Up : false,
      Down: false,
      Left: false,
      Right : false,
    },

    leftKeyCount: {
      name : "left",
      upDown : 0,
      leftRight: 0,
    },

    rightKeyCount: {
      name: "right",
      upDown : 0,
      leftRight: 0,
      stop: false,
      home: false,
    },

  }

  #_leftInputManager;
  #_rightInputManager;
  #_hardwareModel;
  #_hardwareController;

  /**
   * コンストラクタ
   * @param {VPadInputManager} vpadInputManager バーチャルバッドの入力管理クラスを指定します。
   * @param {HardwareModel} hardwareModel 　ハードウェアモデルを指定します。
   */
  constructor(vpadInputManager, hardwareModel){
    super();
    this.#_hardwareController = new HardwareController(vpadInputManager, hardwareModel);
    this.#_hardwareModel = hardwareModel;
    this.inputManager = vpadInputManager;
    this.#_leftInputManager = this.inputManager.inputLeft;
    this.#_rightInputManager = this.inputManager.inputRight;
    setInterval(this.livwViewUpdate, 1000);
  }

  livwViewUpdate()
  {
    const screen = document.getElementById("t1");
    screen.innerHTML=LiveViewImage;
    console.log("liveViewUpdate");
  }

  /**
   * 更新処理
   * @param {number} delta
   * @override
   */
  update(delta) {
    
    super.update(delta);

    // 方向キーのボタンチェック
    this.updateDirectionCheck();

    // 左パッドのボタンチェック
    const leftPadRobotArmsController = this.registerButtonRelease(this.#_leftInputManager.padControlModel);
    const resultLeft = this.checkButton(leftPadRobotArmsController, 
                                      this.inputManager.inputLeft, 
                                      this.#Prop.leftKeyCount);

    const rightPadRobotArmsController = this.registerButtonRelease(this.#_rightInputManager.padControlModel);
    const resuktRight = this.checkButton(rightPadRobotArmsController,
                                      this.inputManager.inputRight,
                                      this.#Prop.rightKeyCount);
}
 

  /**
   * 
   * @param {PadControllerModel} padControlModel 
   * @returns ロボットアームコントローラークラスのインスタンスを返却します。
   */
  registerButtonRelease(padControlModel) {
    const hardwareModel = this.#_hardwareModel;
    const robotArmsController = new RobotArmsController(padControlModel, hardwareModel);
    robotArmsController.onButtonRelease = (output) => {
      robotArmsController.update(output);
      this.resetDirection(output);
    }

    return robotArmsController;
  }

  /**
   * 方向キーチェックを更新します。
   */
  updateDirectionCheck() {
    this.directionCheck(this.inputManager.inputLeft, this.#Prop.leftKeyCount);
    this.directionCheck(this.inputManager.inputRight, this.#Prop.rightKeyCount);
  }

  /**
   * 
   * @param {InpuManager} input 入力マネージャーのインスタンスを指定します。
   * @param {Prop} output 出力プロパティを指定します。
   * @returns 方向の値を返却します。
   */
  directionCheck(input, output)
  {
    const oblique = 1 / Math.sqrt(2);//ななめ移動の値
    const dir = input.checkDirection();
    switch(input.checkDirection()) {
      case input.keyDirections.UP:
        output.upDown++;
        break;
      case input.keyDirections.UP_RIGHT:
        output.leftRight += oblique;
        break;
      case input.keyDirections.RIGHT:
        output.leftRight++;     
        break;
      case input.keyDirections.DOWN_RIGHT:
        output.leftRight += oblique;     
        break;
      case input.keyDirections.DOWN:
        output.upDown--;
        break;
      case input.keyDirections.DOWN_LEFT:
        output.upDown -= oblique;
        break;
      case input.keyDirections.LEFT:
        output.leftRight--;     
        break;
      case input.keyDirections.UP_LEFT:
        output.leftRight -= oblique;     
        break;
      default:
        break;
    }

    return dir;
  }


  /**
   * ボタンの状態をチェックします。
   * @param {RobotArmsController} controller ロボットアームのコントローラーのインスタンスを指定します。
   * @param {InputManager} input 入力マネージャーのインスタンスを指定します。
   * @param {#KeyProp} output 出力先のプロパティを指定します。
   * @returns 
   */
  checkButton(controller, input, output) {
    if (input.checkButton("Up") == input.keyStatus.RELEASE) {
      //上方向を離した時
      controller.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Down") == input.keyStatus.RELEASE) {
      //下方向を離した時
      controller.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Left") == input.keyStatus.RELEASE) {
      //左方向を離した時
      controller.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Right") == input.keyStatus.RELEASE) {
      //右方向を離した時
      controller.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Stop") == input.keyStatus.RELEASE) {
      //ホームボタンを離した時
        output.stop = true;
        controller.onButtonRelease(output);
        output.stop = false;
        return input.keyStatus.RELEASE;
    }

    if (input.checkButton("A") == input.keyStatus.RELEASE) {
      output.home = true;
      controller.onButtonRelease(output);
      output.home = false;
      return input.keyStatus.RELEASE;  
    }

    return input.keyStatus.UNDOWN;
  }
  //
  // 方向リセット
  //
  resetDirection(output) {
    output.upDown = 0;
    output.leftRight = 0;
  }

}



