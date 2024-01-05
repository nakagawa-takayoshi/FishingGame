/**
 * @file hardware.js
 * @brief ハードウェア関連の実装ファイル
 */

//------------------------------------------
/**
 * @brief ハードウェアモデルクラス
 */
class HardwareModel {

    constructor() {
        this.obniz = new Obniz("6453-5471", { access_token:"j6S9JqzEUQwLg5Q6WpVgDDabnHkwx4_pNTe3L2Fw2ZGSAAg5qqFG10_ugfd7geHN" })
    }

    onconnect = () => {
        this.obniz.onconnect = async function() {
            document.getElementById("t1").innerHTML = "";
            var driver = obniz.wired("PCA9685", {i2c:i2c, address:0x40  });
            driver.freq(60);
            this.driver = driver;
          }
   }
    
}

//------------------------------------------
/**
 * @brief モーターのモデルクラス
 */
class Motor {

    /**
     * @brief コンストラクタ
     * @param {AbstractArm} armModel 
     */
    constructor(armModel)
    {
     this.oprationPulse = 0;
      this.model = armModel;
      this._pulse = model.pulse;
    }


    get pluse()
    {
        return this.operationPulse;
    }

    set pluse(value)
    {
        operationPulse = value;
    }
}

//------------------------------------------
/**
 * @brief パッド制御のモデルクラス
 */
class PadControllerModel
{
    constructor(upDownModel, leftRightModel)
    {
        this.upDown = upDownModel;
        this.leftRight = leftRightModel;
    }
}

/**
 * @brief ロボットアームのモデルクラス
 */
class RobotArms
{
    constructor()
    {
        this.arm2 = new Motor(new IArm(new Arm2()));
        this.arm3 = new Motor(new IArm(new Arm3()));
        this.arm4 = new Motor();
        this.arm5 = new Motor();

        this.leftPadControlModel = new PadControllerModel(this.arm2, this.arm3);
        this.rightPadControlModel = new PadControllerModel(this.arm4, this.arm5);
    }
}

/**
 * @brief ロボットアームのインターフェース
 */
class IArm {

    /**
     * @brief コンストラクタ
     * @param {IArm} armModel 
     */
    constructor(armModel) {
        this.armModel = armModle;
    }

    update(pulseCounts) {
        const arm = this.armModel;
        arm.update(pulseCounts);
    }
}

/**
 * @brief ロボットアームの抽象モデルクラス
 */
class AbstractArm extends IArm {

    /**
     * @brief コンストラクタ
     * @param {number} maxPulse 
     * @param {number} minPulse 
     * @param {number} initializePulse 
     */
    constructor(maxPulse, minPulse, initializePulse)
    {
        this.maxPulse = maxPulse;
        this.minPulse = minPulse;
        this.pulse = initializePulse;
    }

    /**
     * @brief パルス数を更新する。
     * @param {*} pulseCounts 
     * @returns 
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
 * @brief アーム２のモデルクラス
 */
class Arm2 extends AbstractArm {

    /**
     * @brief コンストラクタ
     */
    constructor() {
        super(2500, 400, 1400)
        this.pulse = 1400;
    }

}

/**
 * @brief アーム３のモデルクラス
 */
class Arm3 extends AbstractArm {

    /**
     * @brief コンストラクタ
     */
    constructor() {
        super(2500, 400, 1400)
        this.pulse = 1050;
    }
}

/**
 * @brief ロボットアーム制御クラス
 */
class RobotArmsController
{
    #_hardware;

    /**
     * @brief コンストラクタ
     * @param {HardwareModel} hardwere ハードウェアモデルを指定します。
     */
    constructor(hardwere)
    {
        this.#_hardware = hardwere;
    }

    /**
     * @brief モーターを駆動する。
     * @param {number} arm アーム番号を指定します。
     * @param {numer} pulseCounts　パルス数を指定します。
     */
    drive(arm, pulseCounts) {
        const hardware = this.#_hardware;
        console.log("name=" + pulseCounts.name + ", updown=" + pulseCounts.upDown + ", leftRight=" + pulseCounts.leftRight);
        hardware.driver.pulse(arm, pulseCounts);
    }

    /**
     * @brief アーム２を駆動する
     * @param {number} pluseCounts 
     */
    async arm2drive(pulseCounts) {
        const ARM = 2;
        const arm = hardware.arm2;
        const drivePluse = arm.model.update(pluseCounts);
        this.drive(ARM, drivePluse);
    }

    /**
     * @brief アーム３を駆動する
     * @param {number} pluseCounts 
     */
    async arm3drive(pluseCounts) {
        const ARM = 3;
        const hardware = this.#_hardware;
        const arm = hardware.arm3;
        const drivePluse = arm.model.update(pluseCounts);
        this.drive(ARM, drivePluse);
    }

    /**
     * @brief アーム４を駆動する
     * @param {number} pluseCounts 
     */
    async arm4drive(pluseCounts) {
        const ARM = 4;
        const hardware = this.#_hardware;
        this.drive(ARM, pulseCounts);
    }

    /**
     * @brief アーム５を駆動する
     * @param {number} pluseCounts 
     */
    async arm5drive(pluseCounts) {
        const ARM = 5;
        const hardware = this.#_hardware;
        this.drive(ARM, pulseCounts);
    }
}

