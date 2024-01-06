/**
 * @file hardware.js
 * ハードウェア関連の実装ファイル
 */

//------------------------------------------
/**
 * @classdesc ハードウェアモデルクラス
 */
class HardwareModel {

    driver = null;

    /**
     * @brief コンストラクタ
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
    * 
    * @param {AbstractArmModel} armModel 
    * @param {number} pulseCounts 
    * @returns 
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
 * @classdesc ハードウェアコントローラークラス
 */
class HardwareController {

    #_hardwareModel = null;
    #_padControlModel = null;
  
    /**
     * コンストラクタ
     * @param {HardwareModel} hardwareModel ハードウェアモデルのインスタンスを指定します。
     * @param {PadControllerModel} padControlModel パッドコントローラーモデルのインスタンスを指定します。
     */
    constructor(padControlModel, hardwareModel) {
        this.#_hardwareModel = hardwareModel;
        this.#_padControlModel = padControlModel;
    }

    update() {
        const hardwareModel = this.#_hardwareModel;
        const padControlModel = this.#_padControlModel;

        const padUpDownArm = padControlModel.padUpDownArm;
        padUpDownArm.update(padUpDownArm.pulseCounts);

        hardwareModel.drive(padUpDownArm.model.pulseCounts);
        hardwareModel.drive(rightMotor);
    }
}


/**
 * @classdesc モーターのモデルクラス
 */
class Motor {

    model = null;
    number = 0;

    /**
     * コンストラクタ
     * @param {AbstractArm} armModel 
     */
    constructor(armModel) {
        this.oprationPulse = 0;
        this.model = armModel;
        this.number = armModel.number;
    }

    /**
     * パルス数を取得します。
     * @returns {number} パルス数を返却します。
     */
    get pluse() {
        return this.operationPulse;
    }

    /**
     *  パルス数を設定します。
     * @param {number} value
     */
    set pluse(value) {
        this.operationPulse = value;
    }

    /**
     * 更新したパルス数を取得します。 
     * @returns {number} 更新したパルス数を返却します。
     */
    get updatedPulseCounts() {
        return this.model.pulseCounts;
    }

    /**
     * パルス数を更新します。
     */
    update() {
        this.model.update(this.operationPulse);
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
        this.padUpDownArm = padUpDownArm;
        this.padLeftRightArm = padLeftRightArm;
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

        if (this.MaxPulse < this.pulse) {
            this.pulse = this.MaxPulse;
        }
        else if (this.MinPulse > this.pulse)
        {
            this.pulse = this.MinPulse;
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

/**
 * @classdesc ロボットアーム制御クラス
 */
class RobotArmsController
{
    #_hardware;
    #_padControlModel;

    /**
     * @brief コンストラクタ
     * @param {HardwareModel} hardwere ハードウェアモデルを指定します。
     * @param {PadControllerModel} padControlModel パッド制御モデルを指定します。
     */
    constructor(hardwere, padControlModel)
    {
        this.#_hardware = hardwere;
        this.#_padControlModel = padControlModel;
    }

    /**
     * @brief モーターを駆動する。
     * @param {number} armModel アームモデルのインスタンスを指定します。
     * @param {numer} pulseCounts　パルス数を指定します。
     */
    drive(armModel, pulseCounts) {
        const hardware = this.#_hardware;
        const padControlModel = this.#_padControlModel;
        console.log("name=" + pulseCounts.name + ", updown=" + pulseCounts.upDown + ", leftRight=" + pulseCounts.leftRight);
        hardware.driver.pulse(armModel, pulseCounts);
    }

}

