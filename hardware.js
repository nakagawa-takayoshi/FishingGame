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

    game = null;

    /**
     * コンストラクタ
     */
    constructor(game) {
        this.game = game;
        this.obniz = new Obniz("6453-5471", { access_token:"rFaoiZa8KbZHUrp1Z3RUDCSPqk14cdOVrjm_e1Ry8J0P7ZQluoboLTVL4YJLsW8E" })
        this.obniz.onconnect = () => {
            document.getElementById("t1").innerHTML = "";
            const obniz = this.obniz;
            var i2c = obniz.getFreeI2C();
            i2c.start({mode:"master", sda:1, scl:0, clock:400 * 1000 });

            var driver = obniz.wired("PCA9685", {i2c:i2c, address:0x40  });
            driver.freq(60);
            this.driver = driver;
            
            // ゲームのメイン処理を開始します。
            const game = this.game;
            game.main();
          }
    }

   /**
    * ハードウェアをドライブ‘します。
    * @param {AbstractArmModel} armModel アームモデルのインスタンスを指定します。
    * @param {number} pulseCounts パルス数を指定します。
    */
   drive(armModel) {
       const driver = this.driver;
       if (driver == null) {
              return;
       }


        const asyncFunc = async () => {
            const number = armModel.number;

            let operationPuluse = armModel.updatedPulseCounts;
            const pulseCounts = (Math.abs(armModel.pulse) * 5);
            const stepCount = (armModel.pulse >= 0) ? armModel.stepCount : -armModel.stepCount;
            const waitTime = armModel.waitTime;
            for (let ii = 0; ii < pulseCounts; ii++) {
                let pulsed = operationPuluse;
                let outPulse = pulsed + stepCount;
                if (outPulse > armModel.maxPulse) {
                    outPulse = armModel.maxPulse;
                }
                else if (outPulse < armModel.minPulse) {
                    outPulse = armModel.minPulse;
                }
     
                console.log("number=" + number + ", outPulse=" + (outPulse / 1000));
                driver.pulse(number, (outPulse / 1000));
                await this.obniz.wait(waitTime);
                operationPuluse = outPulse;
                if ((outPulse == armModel.maxPulse) || (outPulse == armModel.minPulse)) {
                    break;
                }
            }

            armModel.update(operationPuluse);
        }

        asyncFunc();
    }

    dispose() {
        const obniz = this.obniz;
        const driver = this.driver;
        obniz.reset();
        obniz.closeWait();;    
    }
}


/**
 * @classdesc ロボットアーム制御クラス
 */
class RobotArmsController {

    #_padControlModel = null;
    #_hardwareModel = null;
    /**
     * コンストラクタ
     * @param {PadControllerModel} padControlModel パッドコントローラーモデルのインスタンスを指定します。
     * @param {HardwareModel} hardwareModel ハードウェアモデルのインスタンスを指定します。
     */
    constructor(padControlModel, hardwareModel) {

        this.#_hardwareModel = hardwareModel;
        this.#_padControlModel = padControlModel;
    }

    /**
     * ロボットアームの制御を更新します。
     * @param {#KeyProp} keyProp キーのプロパティを指定します。
     */
    update(keyProp) {
        const padControlModel = this.#_padControlModel;
        const driver = this.#_hardwareModel;

        const padUpDownHardwareModel = padControlModel.padUpDownHardwareModel;
        padUpDownHardwareModel.pulse = keyProp.upDown;
        this.drive(padUpDownHardwareModel);

        const padLeftRightHardwareModel = padControlModel.padLeftRightHardwareModel;
        padLeftRightHardwareModel.pulse = keyProp.leftRight;
        this.drive(padLeftRightHardwareModel);
    }

    /**
     *  ハードウェアをドライブします。
     * @param {Motor} padHardwareModel 
     */
    drive(padHardwareModel) {
        const hardwareModel = this.#_hardwareModel;
        const armNumber = padHardwareModel.number;
        const pulseCounts = padHardwareModel.pulse;

        console.log("armNumber=" + armNumber + ", pulseCounts=" + pulseCounts);
        hardwareModel.drive(padHardwareModel);
    }

    onButtonRelease = (output) => {}

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
        const leftPadContrioller = new LeftPadInputManager(inputManager)
        leftPadContrioller.update(this.#Prop.leftKeyCount);
    }

    updateRightPad() {
        const hardwareModel = this.#_hardwareModel;
        const inputManager = this.#_rightPadInputManager;
        const rightPadContrioller = new PadInputController(inputManager)
        rightPadContrioller.update(this.#Prop.rightKeyCount);
    }

}


/**
 * @classdesc 右パッド入力コントローラークラス
 */
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

class LeftPadInputManager 
{
    #_inputManager = null;
    #_leftRightIndex = 2;
    #_m2PulseTable = new Array(80, 40, 0, -40, -80)

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
            if (this.#_leftRightIndex <= 0) return inputManager.keyStatus.RELEASE;
            //左方向を離した時
            this.#_leftRightIndex--;
            output.leftRight = this.#_m2PulseTable[this.#_leftRightIndex];
            this.onButtonRelease(output);
            return inputManager.keyStatus.RELEASE;
        }
    
        if (inputManager.checkButton("Right") == inputManager.keyStatus.RELEASE) {
            this.#_leftRightIndex--;
            output.leftRight = this.#_m2PulseTable[this.#_leftRightIndex];
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
     * @param {AbstractArmModel} armModel 
     */
    constructor(armModel) {
        this.operationPulse = armModel.pulse;
        this.armModel = armModel;
        this.number = armModel.chanelNumber;
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
     * ステップ数を取得します。
     * @returns {number} ステップ数を返却します。
     */
    get stepCount() {
        return (!this.armModel.inversion) ? this.armModel.stepCount : -this.armModel.stepCount;
    }

    /**
     * 待機時間を取得します。
     * @returns {number} 待機時間を返却します。
     */
    get waitTime() {
        return this.armModel.waitTime;
    }

    /**
     * 最小パルス数を取得します。
     * @returns {number} 最小パルス数を返却します。
     */
    get minPulse() {
        return this.armModel.minPulse;
    }

    /**
     * 最大パルス数を取得します。
     * @returns {number} 最大パルス数を返却します。
     */
    get maxPulse() {
        return this.armModel.maxPulse;
    }

    /**
     * パルス数を更新します。
     */
    update(pulse) {
        this.armModel.update(pulse);
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

        this.leftPadControlModel = new PadControllerModel(this.arm3, this.arm2);
        this.rightPadControlModel = new PadControllerModel(this.arm4, this.arm5);
    }
}

/**
 * @classdesc ロボットアームの抽象モデルクラス
 * @implements IArmModel
 */
class AbstractArmModel  {

    maxPulse = 0;
    minPulse = 0;
    /**
     * @brief コンストラクタ
     * @param {number} maxPulse 
     * @param {number} minPulse 
     * @param {number} initializePulse 
     * 
     */
    constructor(maxPulse, minPulse, initializePulse, stepCount, waitTime, inversion)
    {
        this.maxPulse = 0;
        this.maxPulse = maxPulse;
        this.minPulse = minPulse;
        this.pulse = initializePulse;
        this.stepCount = stepCount;
        this.waitTime = waitTime;
        this.inversion = inversion;
    }

    /**
     * @brief パルス数を更新する。
     * @param {number} updatedpulseCounts 
     */
    update(updatedpulseCounts) {
        this.pulse = updatedpulseCounts;
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
class Arm2 extends AbstractArmModel {

    /**
     * @brief コンストラクタ
     */
    constructor() {
        const inversion = false;

        super(2500, 400, 1400, 5, 1, inversion);
        this.pulse = 1400;
        this.chanelNumber = 2;
        this.armNumber = 2;
    }

}

/**
 * @classdesc アーム３のモデルクラス
 * @extends AbstractArmModel
 * @implements IArmModel
 */
class Arm3 extends AbstractArmModel {

    /**
     * コンストラクタ
     */
    constructor() {
        const inversion = false;

        super(2500, 400, 1050, 2, 10, false)
        this.pulse = 1050;
        this.chanelNumber = 4;
        this.armNumber = 3;
    }
}

/**
 * @classdesc アーム４のモデルクラス
 */
class Arm4 extends AbstractArmModel {
    
    /**
    * コンストラクタ
    */
    constructor() {
        const inversion = true;
        super(2500, 400, 950, 3, 10, inversion)
        this.pulse = 950;
        this.chanelNumber = 6;
        this.armNumber = 4;
    }
}

/**
 * @classdesc アーム５のモデルクラス
 */
class Arm5 extends AbstractArmModel {

    /**
    * コンストラクタ
    */
    constructor() {
        const initializePulse = 1050;
        const stepCount = 2;
        const waitTime = 1;
        const inversion = true;

        super(2500, 400, initializePulse, stepCount, waitTime, inversion)
        this.pulse = initializePulse;
        this.chanelNumber = 8;
        this.armNumber = 5;
    }
}

