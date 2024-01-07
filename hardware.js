/**
 * @file hardware.js
 * ハードウェア関連の実装ファイル
 */

//------------------------------------------
/**
 * @classdesc ハードウェアモデルクラス
 */
class HardwareModel {

    /**
     * @type {PCA9685}
     * モータードライバーのモデル
     */
    driver = null;

    /**
     * コンストラクタ
     */
    constructor() {
        // this.obniz = new Obniz("6453-5471", { access_token:"j6S9JqzEUQwLg5Q6WpVgDDabnHkwx4_pNTe3L2Fw2ZGSAAg5qqFG10_ugfd7geHN" })
    }

    /**
     * 接続時の処理
     */
    onconnect = () => {
        this.obniz.onconnect = async function() {
            document.getElementById("t1").innerHTML = "";
            var driver = obniz.wired("PCA9685", {i2c:i2c, address:0x40  });
            driver.freq(60);
            this.driver = driver;
          }
   }

   /**
    * ハードウェアをドライブ‘します。
    * @param {AbstractArmModel} armModel アームモデルのインスタンスを指定します。
    * @param {number} pulseCounts パルス数を指定します。
    */
   drive(armModel, pulseCounts) {
       const driver = this.driver;
       if (driver == null) {
              return;
       }

       const number = armModel.number;
       driver.pulse(number, pulseCounts);
   }

}


/**
 * @classdesc ロボットアーム制御クラス
 */
class RobotArmsController {

    #_padControlModel = null;
    #_driver = null;
    /**
     * コンストラクタ
     * @param {PadControllerModel} padControlModel パッドコントローラーモデルのインスタンスを指定します。
     * @param {HardwareModel} hardwareModel ハードウェアモデルのインスタンスを指定します。
     */
    constructor(padControlModel, hardwareModel) {

        // this.#_driver = hardwareModel.driver;
        this.#_padControlModel = padControlModel;
    }

    update(keyProp) {
        const padControlModel = this.#_padControlModel;
        const driver = this.#_driver;

        const padUpDownHardwareModel = padControlModel.padUpDownHardwareModel;
        padUpDownHardwareModel.pulse = keyProp.upDown;
        this.drive(padUpDownHardwareModel);

        const padLeftRightHardwareModel = padControlModel.padLeftRightHardwareModel;
        padLeftRightHardwareModel.pulse = keyProp.leftRight;
        this.drive(padLeftRightHardwareModel);
    }

    /**
     *  ハードウェアをドライブします。
     * @param {Motor} hardwareModel 
     */
    drive(hardwareModel) {

        // Motor.update();
        hardwareModel.update();

        const armNumber = hardwareModel.number;
        const pulseCounts = hardwareModel.updatedPulseCounts;

        console.log("armNumber=" + armNumber + ", pulseCounts=" + pulseCounts);
        this.asyncFunc();
        // driver.pulse(armNumber, pulseCounts);
    }

    async asyncFunc() {
        console.log('calling');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}


/**
 * @classdesc ハードウェアコントローラークラス
 */
class HardwareController {
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
        
    #_hardwareModel = null;
    #_leftPadInputManager = null;
    #_rightPadInputManager = null;

    /**
     * コンストラクタ
     * @param {VpadInputManager} vpadInputManager
     * @param {HardwareModel} hardwareModel
     */
    constructor(vpadInputManager, hardwareModel) {
        this.#_leftPadInputManager = vpadInputManager.inputLeft;
        this.#_rightPadInputManager = vpadInputManager.inputRight;
        this.#_hardwareModel = hardwareModel;
    }

    /**
     * 更新処理
     */
    update() {
        updateLeftPad();
        updateRightPad();
    }

    updateLeftPad() {
        const hardwareModel = this.#_hardwareModel;
        const inputManager = this.#_leftPadInputManager;
        const leftPadContrioller = new PadInputController(inputManager)
        leftPadContrioller.update(this.#Prop.leftKeyCount);
    }

    updateRightPad() {
        const hardwareModel = this.#_hardwareModel;
        const inputManager = this.#_rightPadInputManager;
        const rightPadContrioller = new PadInputController(inputManager)
        rightPadContrioller.update(this.#Prop.rightKeyCount);
    }

}

class PadInputController {

    #_inputManager = null;

    /**
     * コンストラクタ
     * @param {InputManager} inputManager
     */
    constructor(inputManager) {
        this.#_inputManager = inputManager;
    }

    update(output) {
        this.directionCheck(output);
        this.buttonCheck(output);
    }

    directionCheck(output)
    {
        const inputManager = this.#_inputManager;
        const oblique = 1 / Math.sqrt(2);//ななめ移動の値
        const dir = inputManager.checkDirection();
        switch(inputManager.checkDirection()) {
            case inputManager.keyDirections.UP:
            output.upDown++;
            break;
            case inputManager.keyDirections.UP_RIGHT:
            output.upDown += oblique;
            output.leftRight += oblique;
            break;
            case inputManager.keyDirections.RIGHT:
            output.leftRight++;     
            break;
            case inputManager.keyDirections.DOWN_RIGHT:
            output.upDown -= oblique;
            output.leftRight += oblique;     
            break;
            case inputManager.keyDirections.DOWN:
            output.upDown--;
            break;
            case inputManager.keyDirections.DOWN_LEFT:
            output.upDown -= oblique;
            output.leftRight -= oblique;     
            break;
            case inputManager.keyDirections.LEFT:
            output.leftRight--;     
            break;
            case inputManager.keyDirections.UP_LEFT:
            output.upDown += oblique;
            output.leftRight -= oblique;     
            break;
            default:
            break;
        }
    
        return dir;
    }
  
    checkButton(output) {
        const inputManager = this.#_inputManager;
        if (inputManager.checkButton("Up") == inputManager.keyStatus.RELEASE) {
          //上方向を離した時
          this.onButtonRelease(output);
          return inputManager.keyStatus.RELEASE;
        }
    
        if (inputManager.checkButton("Down") == inputManager.keyStatus.RELEASE) {
          //下方向を離した時
          this.onButtonRelease(output);
          return inputManager.keyStatus.RELEASE;
        }
    
        if (inputManager.checkButton("Left") == inputManager.keyStatus.RELEASE) {
          //左方向を離した時
          this.onButtonRelease(output);
          return inputManager.keyStatus.RELEASE;
        }
    
        if (inputManager.checkButton("Right") == inputManager.keyStatus.RELEASE) {
          //右方向を離した時
          this.onButtonRelease(output);
          return inputManager.keyStatus.RELEASE;
        }
    
        return inputManager.keyStatus.UNDOWN;
    }

    onButtonRelease(output) {
        const inputManager = this.#_inputManager;
        console.log("name=" + output.name + ", updown=" + output.upDown + ", leftRight=" + output.leftRight);
        const padControlModel = inputManager.padControlModel;
        const robotArmsController = new RobotArmsController(padControlModel, this.hardwareModel);
        robotArmsController.update(output);
        this.resetDirection(output);
    }

    //
    // 方向リセット
    //
    resetDirection(output) {
        output.upDown = 0;
        output.leftRight = 0;
    }
}


/**
 * @classdesc モーターのモデルクラス
 */
class Motor {

    armModel = null;
    number = 0;
    operationPulse = 0;

    /**
     * コンストラクタ
     * @param {AbstractArm} armModel 
     */
    constructor(armModel) {
        this.oprationPulse = 0;
        this.armModel = armModel;
        this.number = armModel.armNumber;
    }

    /**
     * パルス数を取得します。
     * @returns {number} パルス数を返却します。
     */
    get pulse() {
        return this.operationPulse;
    }

    /**
     *  パルス数を設定します。
     * @param {number} value
     */
    set pulse(value) {
        this.operationPulse = value;
    }

    /**
     * 更新したパルス数を取得します。 
     * @returns {number} 更新したパルス数を返却します。
     */
    get updatedPulseCounts() {
        return this.armModel.pulse;
    }

    /**
     * パルス数を更新します。
     */
    update() {
        this.armModel.update(this.operationPulse);
    }

}

//------------------------------------------
/**
 * @classdesc パッド制御のモデルクラス
 */
class PadControllerModel
{
    /**
     * コンストラクタ
     * @param {Motor} padUpDownArm 
     * @param {Motor} padLeftRightArm 
     */
    constructor(padUpDownArm, padLeftRightArm)
    {
        this.padUpDownHardwareModel = padUpDownArm;
        this.padLeftRightHardwareModel = padLeftRightArm;
    }
}

/**
 * @classdesc ロボットアームのモデルクラス
 */
class RobotArms
{
    leftPadControlModel;
    rightPadControlModel;

    /**
     * コンストラクタ
     * @param {HardwareModel} hardwareModel
     */
    constructor(hardwareModel) {
        this.hardwareModel = hardwareModel;
        this.arm2 = new Motor(new Arm2());
        this.arm3 = new Motor(new Arm3());
        this.arm4 = new Motor(new Arm4());
        this.arm5 = new Motor(new Arm5());

        this.leftPadControlModel = new PadControllerModel(this.arm2, this.arm3);
        this.rightPadControlModel = new PadControllerModel(this.arm4, this.arm5);
    }
}

/**
 * @classdesc ロボットアームの抽象モデルクラス
 * @implements IArmModel
 */
class AbstractArm  {

    maxPulse = 0;
    minPulse = 0;
    /**
     * @brief コンストラクタ
     * @param {number} maxPulse 
     * @param {number} minPulse 
     * @param {number} initializePulse 
     */
    constructor(maxPulse, minPulse, initializePulse)
    {
        this.maxPulse = 0;
        this.maxPulse = maxPulse;
        this.minPulse = minPulse;
        this.pulse = initializePulse;
    }

    /**
     * @brief パルス数を更新する。
     * @param {number} pulseCounts 
     */
    update(pulseCounts) {
        this.pulse += pulseCounts;
        if (this.pulse == 0) return;

        if (this.maxPulse < this.pulse) {
            this.pulse = this.maxPulse;
        }
        else if (this.minPulse > this.pulse)
        {
            this.pulse = this.minPulse;
        }

        return this.pulse;
    }
}

/**
 * @classdesc アーム２のモデルクラス
 */
class Arm2 extends AbstractArm {

    /**
     * @brief コンストラクタ
     */
    constructor() {
        super(2500, 400, 1400);
        this.pulse = 1400;
        this.armNumber = 2;
    }

}

/**
 * @classdesc アーム３のモデルクラス
 * @extends AbstractArm
 * @implements IArmModel
 */
class Arm3 extends AbstractArm {

    /**
     * コンストラクタ
     */
    constructor() {
        super(2500, 400, 1400)
        this.pulse = 1050;
        this.armNumber = 3;
    }
}

/**
 * @classdesc アーム４のモデルクラス
 */
class Arm4 extends AbstractArm {
    
    /**
    * コンストラクタ
    */
    constructor() {
        super(2500, 400, 1400)
        this.pulse = 1400;
        this.armNumber = 4;
    }
}

/**
 * @classdesc アーム５のモデルクラス
 */
class Arm5 extends AbstractArm {

    /**
    * コンストラクタ
    */
    constructor() {
        super(2500, 400, 1400)
        this.pulse = 1400;
        this.armNumber = 5;
    }
}

