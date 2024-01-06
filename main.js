//設定用
const Config = {
    //画面の解像度
    Screen: {
      Width: 256,//幅
      Height: 256,//高さ
      BackGroundColor: 0xffffff,//背景色
    },
    Keys: { //キーボード入力
      Up: "w",
      Right: "d",
      Down: "s",
      Left: "a",
    },
  }

let fishing;
let robotArms;
let vpadManager;
let input;

window.onload = () => {
    fishing = new FishingGame(Config.Screen.Width, Config.Screen.Height, Config.Screen.BackGroundColor);
    document.getElementById("t1").innerHTML = "<div style=\"color:white\">Loading..</div>";
    //cssのidを設定
    fishing.app.view.id = "game-screen";    
    robotArms = fishing.robotArms;
    vpadManager = new VPadInpuManager(robotArms);

    fishing.onload = () => {
        fishing.replaceScene(new MainScene(vpadManager));
    }

    //データのロード
    fishing.preload();

}

let bullet;

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
    },

  }

  #_upDown;
  #_leftRight;
  #_upDownControl;
  #_leftRightControl;
  #_hardwareModel;
  #_leftInputManager;
  #_rightInputManager;

  /**
   * コンストラクタ
   * @param {VPadInputManager} vpadInputManager バーチャルバッドの入力管理クラスを指定します。
   * @param {HardwareModel} hardwareModel 　ハードウェアモデルを指定します。
   */
  constructor(vpadInputManager){
    super();
    this.#_upDown = 0;
    this.#_leftRight = 0;
    this.inputManager = vpadInputManager;
    this.#_leftInputManager = this.inputManager.inputLeft;
    this.#_rightInputManager = this.inputManager.inputRight;

    bullet = new Graphics();
    this.addChild(bullet);
    bullet.circFill(0, 0, 4, 0xff0000);
    bullet.y = -10;
  }


  update(delta){
    super.update(delta);

    // 方向キーのボタンチェック
    this.updateDirectionCheck();

    // 左パッドのボタンチェック
    this.onButtonRelease = (output) => {
        console.log("name=" + output.name + ", updown=" + output.upDown + ", leftRight=" + output.leftRight);
        this.resetDirection(output);
    }

    const resultLeft = this.checkButton(this.inputManager.inputLeft, this.#Prop.leftKeyCount);

    // 右パッドのボタンチェック
    this.onButtonRelease = (output) => {
      console.log("name=" + output.name + ", updown=" + output.upDown + ", leftRight=" + output.leftRight);
      this.resetDirection(output);
    }
    const resuktRight = this.checkButton(this.inputManager.inputRight, this.#Prop.rightKeyCount);

    this.onButtonRelease = () => { }
  }

  updateDirectionCheck() {
    const oblique = 1 / Math.sqrt(2);//ななめ移動の値
    this.directionCheck(this.inputManager.inputLeft, this.#Prop.leftKeyCount);
    this.directionCheck(this.inputManager.inputRight, this.#Prop.rightKeyCount);
  }

  directionCheck(input, output)
  {
    const oblique = 1 / Math.sqrt(2);//ななめ移動の値
    const dir = input.checkDirection();
    if (dir != 0)
    {
      const a = 1;
    }
    switch(input.checkDirection()) {
      case input.keyDirections.UP:
        output.upDown++;
        break;
      case input.keyDirections.UP_RIGHT:
        output.upDown += oblique;
        output.leftRight += oblique;
        break;
      case input.keyDirections.RIGHT:
        output.leftRight++;     
        break;
      case input.keyDirections.DOWN_RIGHT:
        output.upDown -= oblique;
        output.leftRight += oblique;     
        break;
      case input.keyDirections.DOWN:
        output.upDown--;
        break;
      case input.keyDirections.DOWN_LEFT:
        output.upDown -= oblique;
        output.leftRight -= oblique;     
        break;
      case input.keyDirections.LEFT:
        output.leftRight--;     
        break;
      case input.keyDirections.UP_LEFT:
        output.upDown += oblique;
        output.leftRight -= oblique;     
        break;
      default:
        break;
    }

    return dir;
  }

  checkButton(input, output) {
    if (input.checkButton("Up") == input.keyStatus.RELEASE) {
      //上方向を離した時
      this.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Down") == input.keyStatus.RELEASE) {
      //下方向を離した時
      this.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Left") == input.keyStatus.RELEASE) {
      //左方向を離した時
      this.onButtonRelease(output);
      return input.keyStatus.RELEASE;
    }

    if (input.checkButton("Right") == input.keyStatus.RELEASE) {
      //右方向を離した時
      this.onButtonRelease(output);
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

  onButtonRelease = (output) => { 
    console.log("onButtonRelease");
  }
}



