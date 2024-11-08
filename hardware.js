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

    arm2 = undefined;
    arm3 = undefined;
    arm4 = undefined;
    arm5 = undefined;

    /**
     * コンストラクタ
     */
    constructor(game) {
        this.game = game;
        this.obniz = new Obniz("6453-5471", { access_token:"rFaoiZa8KbZHUrp1Z3RUDCSPqk14cdOVrjm_e1Ry8J0P7ZQluoboLTVL4YJLsW8E" })

        this.arm2 = new Motor(new Arm2());
        this.arm3 = new Motor(new Arm3());
        this.arm4 = new Motor(new Arm4());
        this.arm5 = new Motor(new Arm5());

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

            if (armModel.autoReset == true) {
                driver.pulse(number, (armModel.originPulse / 1000));
                console.log("number=" + number + ", originPulse=" + (armModel.originPulse / 1000));
                armModel.update(armModel.originPulse);
                return;
            }

            armModel.update(operationPuluse);
        }

        asyncFunc();
    }
 
    resetToStop() {
        const asyncFunc = async () => {
            const arm2 = this.arm2;
            const arm3 = this.arm3;
            const arm4 = this.arm4;
            const arm5 = this.arm5;

            const driver = this.driver;
            driver.pulse(arm3.number, (arm3.originPulse / 1000));
            driver.pulse(arm4.number, (arm4.originPulse / 1000));

            console.log("reset to stop");
            arm3.update(arm3.originPulse);
            arm4.update(arm4.originPulse);
        }

        asyncFunc();
    }

    resetToOrigin() {
        const asyncFunc = async () => {
            const arm2 = this.arm2;
            const arm3 = this.arm3;
            const arm4 = this.arm4;
            const arm5 = this.arm5;

            const driver = this.driver;
            driver.pulse(arm3.number, (arm3.originPulse / 1000));
            driver.pulse(arm4.number, (arm4.originPulse / 1000));
            driver.pulse(arm2.number, (arm2.originPulse / 1000));
            this.wait(100);
            driver.pulse(arm5.number, (arm5.originPulse / 1000));
            this.wait(100);

            console.log("reset to origin");
            arm2.update(arm2.originPulse);
            arm3.update(arm3.originPulse);
            arm4.update(arm4.originPulse);
            arm5.update(arm5.originPulse);
        }

        asyncFunc();
    }

    /**
     * 指定時間を待ちます。
     * @param {number} time 待ち時間を指定します。
     */
    wait(time) {
        this.obniz.wait(time);
    }

    /**
     * リソースの後片付けを行います。
     */
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
        if (keyProp.stop) {
            this.resetToStop();
            return;
        }

        if (keyProp.home) {
            this.resetToOrigin();
        }

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

    /**
     * ロボットアームを原点に戻します。
     */
    resetToStop() {
        const hardwareModel = this.#_hardwareModel;
        hardwareModel.resetToStop();
    }

    resetToOrigin() {
        const hardwareModel = this.#_hardwareModel;
        hardwareModel.resetToOrigin();
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
        this.updateLeftPad();
        this.updateRightPad();
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

/**
 * @classdesc パッド入力コントローラークラス
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

    /**
     * パッド入力の更新処理
     * @param {KeyProp} output プロパティを指定します。
     */
    update(output) {
        this.directionCheck(output);
        this.buttonCheck(output);
    }

    /**
     * 方向の入力チェックを行います。
     * @param {KeyProp} output 出力プロパティを指定します。
     * @returns 入力方向を返却します。
     */
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
            output.leftRight += oblique;
            break;
            case inputManager.keyDirections.RIGHT:
            output.leftRight++;     
            break;
            case inputManager.keyDirections.DOWN_RIGHT:
            output.leftRight += oblique;     
            break;
            case inputManager.keyDirections.DOWN:
            output.upDown--;
            break;
            case inputManager.keyDirections.DOWN_LEFT:
            output.leftRight -= oblique;     
            break;
            case inputManager.keyDirections.LEFT:
            output.leftRight--;     
            break;
            case inputManager.keyDirections.UP_LEFT:
            output.leftRight -= oblique;     
            break;
            default:
            break;
        }
    
        return dir;
    }
  
    /**
     * パッドの入力をチェックします。
     * @param {KeyProp} output プロパティを指定します。
     * @returns 
     */
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

    /**
     * 
     * @param {*} output 
     */
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

    get originPulse() {
        return this.armModel.originPulse;
    }

    get autoReset() {
        return this.armModel.autoReset;
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
        const arm2 = hardwareModel.arm2;
        const arm3 = hardwareModel.arm3;
        const arm4 = hardwareModel.arm4;
        const arm5 = hardwareModel.arm5;

        this.leftPadControlModel = new PadControllerModel(arm3, arm2);
        this.rightPadControlModel = new PadControllerModel(arm4, arm5);
    }
}

/**
 * @classdesc ロボットアームの抽象モデルクラス
 * @implements IArmModel
 */
class AbstractArmModel  {

    maxPulse = 0;
    minPulse = 0;
    autoReset = true;

    /**
     * @brief コンストラクタ
     * @param {number} maxPulse 
     * @param {number} minPulse 
     * @param {number} initializePulse 
     * 
     */
    constructor(maxPulse, minPulse, initializePulse, stepCount, waitTime, inversion, autoReset)
    {
        this.maxPulse = 0;
        this.maxPulse = maxPulse;
        this.minPulse = minPulse;
        this.pulse = initializePulse;
        this.stepCount = stepCount;
        this.waitTime = waitTime;
        this.inversion = inversion;
        this.originPulse = initializePulse;
        this.autoReset = autoReset;
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
        const maxPulse = 1400;
        const minPulse = 600;
        const initializePulse = 1000;
        const stepCount = 2;
        const waitTime = 5;

        super(maxPulse, minPulse, initializePulse, stepCount, waitTime, inversion, false);
        this.pulse = initializePulse;
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

        super(2500, 400, 1360, 2, 10, false, true)
        this.pulse = 1360;
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
        super(2500, 400, 1360, 3, 10, inversion, true)
        this.pulse = 1360;
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
        const initializePulse = 1600;
        const stepCount = 2;
        const waitTime = 1;
        const inversion = false;

        super(2000, 1100, initializePulse, stepCount, waitTime, inversion, false)
        this.pulse = initializePulse;
        this.chanelNumber = 8;
        this.armNumber = 5;
    }
}

